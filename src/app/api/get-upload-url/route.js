import { createClient } from "@supabase/supabase-js";
import { getPresignedUploadUrl } from "../../../lib/r2";

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

  let rawContentType = "video/webm";
  try {
    const body = await request.json();
    if (body.contentType) rawContentType = body.contentType;
  } catch { /* default to webm */ }

  // Strip codec parameters — R2 requires a bare MIME type when signing.
  const contentType = rawContentType.split(";")[0].trim();
  const ext = contentType.includes("mp4") ? "mp4" : "webm";
  const filename = `${user.id}/${Date.now()}.${ext}`;

  const presignedUrl = await getPresignedUploadUrl(filename, contentType);

  // Return the normalised contentType so the client uses the exact same value
  // in the PUT Content-Type header (required for presigned URL signature match).
  return Response.json({ presignedUrl, filename, contentType });
}
