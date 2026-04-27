import { createClient } from "@supabase/supabase-js";
import { downloadVideo, uploadVideo } from "../../../lib/r2";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegStatic);

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

  const { videoId, r2Key } = body;
  if (!videoId || !r2Key) {
    return Response.json({ error: "Missing videoId or r2Key" }, { status: 400 });
  }

  const mp4Key = r2Key.replace(/\.\w+$/, ".mp4");
  const tmpIn = join(tmpdir(), `lp-${videoId}.webm`);
  const tmpOut = join(tmpdir(), `lp-${videoId}.mp4`);

  try {
    const webmBuffer = await downloadVideo(r2Key);
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
    const mp4Url = await uploadVideo(mp4Buffer, mp4Key, "video/mp4");

    const { error: updateError } = await supabase
      .from("videos")
      .update({ mp4_url: mp4Url, transcoded: true })
      .eq("id", videoId);

    if (updateError) {
      console.error("Supabase update error:", updateError);
    }

    return Response.json({ success: true, mp4Url });
  } catch (err) {
    console.error("Transcode error:", err);
    return Response.json({ error: "Transcoding failed", detail: String(err) }, { status: 500 });
  } finally {
    await unlink(tmpIn).catch(() => {});
    await unlink(tmpOut).catch(() => {});
  }
}
