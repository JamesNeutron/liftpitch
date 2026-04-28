import { createClient } from "@supabase/supabase-js";
import { uploadVideo } from "../../../lib/r2";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegStatic);

// Allow long-running transcoding on Vercel; disable static optimisation so
// the request body is always streamed fresh.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
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

  // ── Upload WebM to R2 ───────────────────────────────────────────────────────
  const ext = contentType.includes("mp4") ? "mp4" : "webm";
  const base = `${user.id}/${Date.now()}`;
  const filename = `${base}.${ext}`;

  let buffer;
  let r2Url;
  try {
    buffer = Buffer.from(await videoFile.arrayBuffer());
    r2Url = await uploadVideo(buffer, filename, contentType);
  } catch (err) {
    console.error("R2 upload error:", err);
    return Response.json({ error: "Upload to storage failed", detail: String(err) }, { status: 500 });
  }

  // ── Transcode WebM → MP4 (awaited, same function invocation) ───────────────
  // We already have the buffer in memory so we skip re-downloading from R2.
  // Transcoding here (not fire-and-forget) guarantees the MP4 exists before
  // the share link is returned to the user.
  let mp4Url = null;
  if (ext === "webm") {
    const mp4Key = `${base}.mp4`;
    const stamp = Date.now();
    const tmpIn = join(tmpdir(), `lp-${stamp}.webm`);
    const tmpOut = join(tmpdir(), `lp-${stamp}.mp4`);
    try {
      await writeFile(tmpIn, buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(tmpIn)
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions(["-movflags faststart", "-preset fast", "-crf 23"])
          .output(tmpOut)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });
      const mp4Buffer = await readFile(tmpOut);
      mp4Url = await uploadVideo(mp4Buffer, mp4Key, "video/mp4");
    } catch (err) {
      // Transcoding failure is non-fatal: viewer falls back to the WebM source.
      console.error("Transcode error:", err);
    } finally {
      await unlink(tmpIn).catch(() => {});
      await unlink(tmpOut).catch(() => {});
    }
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
        mp4_url: mp4Url,
        transcoded: mp4Url !== null,
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

  // ── Persist share_link now that we have the video UUID ─────────────────────
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
