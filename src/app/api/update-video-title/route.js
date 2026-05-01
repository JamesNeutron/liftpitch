import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let videoId, newTitle;
  try {
    ({ videoId, newTitle } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!videoId || typeof newTitle !== "string" || !newTitle.trim()) {
    return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await admin
    .from("videos")
    .update({ video_title: newTitle.trim() })
    .eq("id", videoId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("[update-video-title] Update error:", error.message);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
