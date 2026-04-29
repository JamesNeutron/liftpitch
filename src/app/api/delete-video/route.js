import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let videoId, streamUid;
  try {
    const body = await request.json();
    videoId = body.videoId;
    streamUid = body.streamUid;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!videoId) return Response.json({ error: "Missing videoId" }, { status: 400 });

  // Verify ownership before deleting
  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("id, user_id, stream_uid")
    .eq("id", videoId)
    .single();

  if (fetchError || !video) return Response.json({ error: "Video not found" }, { status: 404 });
  if (video.user_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const uid = streamUid || video.stream_uid;

  // Delete from Cloudflare Stream
  if (uid) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;
    try {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${streamToken}` },
        }
      );
      if (!cfRes.ok) {
        console.error("[delete-video] Cloudflare delete failed:", cfRes.status, await cfRes.text());
      }
    } catch (err) {
      console.error("[delete-video] Cloudflare delete error:", err?.message);
    }
  }

  // Delete from Supabase
  const { error: deleteError } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId);

  if (deleteError) {
    console.error("[delete-video] Supabase delete error:", deleteError.message);
    return Response.json({ error: "Failed to delete video record" }, { status: 500 });
  }

  return Response.json({ success: true });
}
