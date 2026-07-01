import { createClient } from "@supabase/supabase-js";
import { clientIp } from "../../../../lib/stream";

export const dynamic = "force-dynamic";

const SECONDS_PER_QUESTION = 60;
const DURATION_BUFFER = 15; // small guard on top of the allotted answer time

// Best-effort, per-instance in-memory rate limit. In a serverless deployment
// this only covers requests that land on the same warm instance, so it's a soft
// speed bump, not a hard guarantee — deferred hardening (KV/Upstash or a
// Turnstile challenge) will replace this. Keyed by client IP.
const RATE_LIMIT = 5; // uploads
const RATE_WINDOW_MS = 60_000; // per minute
const hits = new Map(); // ip -> number[] (recent timestamps)

function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

export async function POST(request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let roleId;
  try {
    ({ roleId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!roleId) return Response.json({ error: "Missing roleId" }, { status: 400 });

  // Service-role client: the roles table is owner-only, so we resolve the role
  // through the SECURITY DEFINER get_recording_role function (same source of
  // truth the /r page uses). No auth, no quota — sponsored is accountless.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.rpc("get_recording_role", { role_id: roleId });
  const role = data?.[0];
  if (error || !role) {
    if (error) console.error("[sponsored/get-upload-url] role load failed:", error.message);
    return Response.json({ error: "Role not found" }, { status: 404 });
  }

  const questionCount = [role.question_1, role.question_2].filter(q => q && q.trim()).length;
  const maxDurationSeconds = Math.max(1, questionCount) * SECONDS_PER_QUESTION + DURATION_BUFFER;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${streamToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds, requireSignedURLs: false }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[sponsored/get-upload-url] Stream API error:", res.status, text);
    return Response.json({ error: "Failed to get Stream upload URL" }, { status: 500 });
  }

  const { result } = await res.json();
  return Response.json({ uploadURL: result.uploadURL, uid: result.uid });
}
