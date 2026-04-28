import { createClient } from "@supabase/supabase-js";
import { downloadVideo, uploadVideo, getVideoUrl } from "../../../lib/r2";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegStatic);

export const maxDuration = 60;
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

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, verificationHash = "" } = body;
  if (!filename) return Response.json({ error: "Missing filename" }, { status: 400 });

  const r2Url = getVideoUrl(filename);
  const isWebm = filename.endsWith(".webm");

  // ── Transcode WebM → MP4 (awaited inline) ──────────────────────────────────
  // The file was uploaded directly to R2 by the client, so we download it here
  // for transcoding. Transcoding is done synchronously so the share link is only
  // returned once the MP4 is ready.
  let mp4Url = null;
  if (isWebm) {
    const mp4Key = filename.replace(/\.webm$/, ".mp4");
    const stamp = Date.now();
    const tmpIn = join(tmpdir(), `lp-${stamp}.webm`);
    const tmpOut = join(tmpdir(), `lp-${stamp}.mp4`);
    try {
      const webmBuffer = await downloadVideo(filename);
      await writeFile(tmpIn, webmBuffer);
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
      // Non-fatal: viewer falls back to the WebM source.
      console.error("Transcode error:", err);
    } finally {
      await unlink(tmpIn).catch(() => {});
      await unlink(tmpOut).catch(() => {});
    }
  }

  // ── Save record to Supabase ─────────────────────────────────────────────────
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
    return Response.json({ error: "Failed to save video record", detail: String(err) }, { status: 500 });
  }

  // ── Persist share_link ──────────────────────────────────────────────────────
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://lift-pitch.co").replace(/\/$/, "");
  const shareLink = `${appUrl}/v/${videoRecord.id}`;

  await supabase.from("videos").update({ share_link: shareLink }).eq("id", videoRecord.id);

  return Response.json({ shareLink, videoUrl: r2Url, videoId: videoRecord.id });
}
