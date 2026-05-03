import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Free tier: max 1 video
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  if (profile?.plan !== "pro" && profile?.plan !== "lifetime") {
    const { count } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= 1) {
      return Response.json({ error: "free_limit_reached" }, { status: 403 });
    }
  }

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
      body: JSON.stringify({ maxDurationSeconds: 120, requireSignedURLs: false }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[get-upload-url] Stream API error:", res.status, text);
    return Response.json({ error: "Failed to get Stream upload URL" }, { status: 500 });
  }

  const { result } = await res.json();
  return Response.json({ uploadURL: result.uploadURL, uid: result.uid });
}
