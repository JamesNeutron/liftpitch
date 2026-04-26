import { createClient } from "@supabase/supabase-js";
import { uploadVideo } from "../../../lib/r2";

// NOTE: Next.js serverless functions have a body-size limit (4.5 MB on Vercel
// free tier). For longer recordings consider switching to presigned URL uploads
// (getPresignedUploadUrl is exported from src/lib/r2.js) so the browser
// uploads directly to R2 and only metadata is posted here.

export async function POST(request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build a server-side Supabase client that acts as the authenticated user.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse FormData ──────────────────────────────────────────────────────────
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return Response.json({ error: "Invalid form data", detail: String(err) }, { status: 400 });
  }

  const videoFile = formData.get("video");
  const verificationHash = formData.get("verificationHash") || "";
  const contentType = formData.get("contentType") || "video/webm";
  const companyName = formData.get("companyName") || null;
  const roleName = formData.get("roleName") || null;

  if (!videoFile || typeof videoFile === "string") {
    return Response.json({ error: "No video file provided" }, { status: 400 });
  }

  // ── Upload to R2 ────────────────────────────────────────────────────────────
  const ext = contentType.includes("mp4") ? "mp4" : "webm";
  const filename = `${user.id}/${Date.now()}.${ext}`;

  let r2Url;
  try {
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    r2Url = await uploadVideo(buffer, filename, contentType);
  } catch (err) {
    console.error("R2 upload error:", err);
    return Response.json({ error: "Upload to storage failed", detail: String(err) }, { status: 500 });
  }

  // ── Save metadata to Supabase ───────────────────────────────────────────────
  let videoRecord;
  try {
    const { data, error } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        verification_hash: verificationHash,
        filename,
        r2_url: r2Url,
        company_name: companyName,
        role_name: roleName,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        { error: "Failed to save video record", detail: error.message, code: error.code },
        { status: 500 }
      );
    }
    videoRecord = data;
  } catch (err) {
    console.error("Supabase insert exception:", err);
    return Response.json({ error: "Failed to save video record", detail: err.message || String(err) }, { status: 500 });
  }

  // ── Update share_link now that we have the video UUID ───────────────────────
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://lift-pitch.co").replace(/\/$/, "");
  const shareLink = `${appUrl}/v/${videoRecord.id}`;

  const { error: updateError } = await supabase
    .from("videos")
    .update({ share_link: shareLink })
    .eq("id", videoRecord.id);
  if (updateError) {
    console.error("Failed to persist share_link:", updateError.message);
  }

  return Response.json({
    shareLink,
    videoUrl: r2Url,
    videoId: videoRecord.id,
  });
}
