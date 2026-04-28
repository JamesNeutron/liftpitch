import { createClient } from "@supabase/supabase-js";
import { downloadVideo, uploadVideo, getVideoUrl } from "../../../lib/r2";
import { writeFile, readFile, unlink } from "fs/promises";
import { existsSync, copyFileSync, chmodSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import fluent from "fluent-ffmpeg";
import ffmpegStaticPath from "ffmpeg-static";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ── Ensure the ffmpeg binary is executable ────────────────────────────────────
// On Vercel/Lambda the deployment package is read-only. Copying the binary to
// /tmp (the only writable directory) and chmod-ing it lets Node.js exec it.
// This runs once per cold start; subsequent warm invocations reuse the copy.
const TMP_FFMPEG = join(tmpdir(), "ffmpeg-lp");

function ensureFfmpegExecutable() {
  console.log("[register-video] ffmpeg-static source path:", ffmpegStaticPath);
  if (!ffmpegStaticPath) {
    throw new Error("ffmpeg-static did not resolve a binary path");
  }
  if (!existsSync(TMP_FFMPEG)) {
    console.log("[register-video] Copying ffmpeg binary to", TMP_FFMPEG);
    copyFileSync(ffmpegStaticPath, TMP_FFMPEG);
    chmodSync(TMP_FFMPEG, 0o755);
    console.log("[register-video] ffmpeg binary ready");
  } else {
    console.log("[register-video] ffmpeg binary already present at", TMP_FFMPEG);
  }
  fluent.setFfmpegPath(TMP_FFMPEG);
}

try {
  ensureFfmpegExecutable();
} catch (err) {
  console.error("[register-video] Failed to initialise ffmpeg binary:", err?.message, err?.stack);
}

export async function POST(request) {
  console.log("[register-video] POST received");

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) {
    console.error("[register-video] Missing auth token");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  let user;
  try {
    const { data: { user: u }, error } = await supabase.auth.getUser();
    if (error || !u) {
      console.error("[register-video] Auth failed:", error?.message);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = u;
    console.log("[register-video] Authenticated user:", user.id);
  } catch (err) {
    console.error("[register-video] Auth exception:", err?.message, err?.stack);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let filename, verificationHash;
  try {
    const body = await request.json();
    filename = body.filename;
    verificationHash = body.verificationHash || "";
  } catch (err) {
    console.error("[register-video] Body parse error:", err?.message);
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!filename) {
    console.error("[register-video] Missing filename in body");
    return Response.json({ error: "Missing filename" }, { status: 400 });
  }
  console.log("[register-video] filename:", filename, "| verificationHash:", verificationHash);

  // ── Construct public R2 URL ───────────────────────────────────────────────
  const r2Url = getVideoUrl(filename);
  console.log("[register-video] r2Url:", r2Url);

  // ── Insert Supabase row immediately ──────────────────────────────────────
  // Row is created before transcoding so the share link can always be returned.
  // The transcoding step below then updates mp4_url / transcoded on this row.
  let videoRecord;
  try {
    const { data, error } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        verification_hash: verificationHash,
        filename,
        r2_url: r2Url,
        mp4_url: null,
        transcoded: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[register-video] Supabase insert error:", error.message, "code:", error.code, "details:", error.details);
      return Response.json(
        { error: "Failed to save video record", detail: error.message, code: error.code },
        { status: 500 }
      );
    }
    videoRecord = data;
    console.log("[register-video] Supabase row created, id:", videoRecord.id);
  } catch (err) {
    console.error("[register-video] Supabase insert exception:", err?.message, err?.stack);
    return Response.json({ error: "Failed to save video record", detail: String(err) }, { status: 500 });
  }

  // ── Persist share_link ────────────────────────────────────────────────────
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://lift-pitch.co").replace(/\/$/, "");
  const shareLink = `${appUrl}/v/${videoRecord.id}`;
  try {
    const { error } = await supabase
      .from("videos")
      .update({ share_link: shareLink })
      .eq("id", videoRecord.id);
    if (error) console.error("[register-video] share_link update error:", error.message);
    else console.log("[register-video] share_link set:", shareLink);
  } catch (err) {
    console.error("[register-video] share_link update exception:", err?.message);
  }

  // ── Transcode WebM → MP4 ──────────────────────────────────────────────────
  const isWebm = filename.endsWith(".webm");
  if (!isWebm) {
    console.log("[register-video] Not a WebM file — skipping transcode");
  } else if (!existsSync(TMP_FFMPEG)) {
    console.error("[register-video] Skipping transcode — ffmpeg binary not available at", TMP_FFMPEG);
  } else {
    const mp4Key = filename.replace(/\.webm$/, ".mp4");
    const stamp = Date.now();
    const tmpIn = join(tmpdir(), `lp-${stamp}.webm`);
    const tmpOut = join(tmpdir(), `lp-${stamp}.mp4`);
    let mp4Url = null;

    try {
      // 1. Download WebM from R2
      console.log("[register-video] Downloading WebM from R2:", filename);
      const webmBuffer = await downloadVideo(filename);
      console.log("[register-video] Downloaded", webmBuffer.length, "bytes");

      // 2. Write to /tmp
      await writeFile(tmpIn, webmBuffer);
      console.log("[register-video] Wrote input to", tmpIn);

      // 3. Run ffmpeg
      console.log("[register-video] Starting ffmpeg transcode");
      await new Promise((resolve, reject) => {
        fluent(tmpIn)
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions(["-movflags faststart", "-preset fast", "-crf 23"])
          .output(tmpOut)
          .on("start", (cmd) => console.log("[register-video] ffmpeg cmd:", cmd))
          .on("stderr", (line) => console.log("[register-video] ffmpeg:", line))
          .on("end", () => { console.log("[register-video] ffmpeg finished"); resolve(); })
          .on("error", (err) => { console.error("[register-video] ffmpeg error:", err?.message, err?.stack); reject(err); })
          .run();
      });

      // 4. Upload MP4 to R2
      const mp4Buffer = await readFile(tmpOut);
      console.log("[register-video] MP4 size:", mp4Buffer.length, "bytes");
      mp4Url = await uploadVideo(mp4Buffer, mp4Key, "video/mp4");
      console.log("[register-video] MP4 uploaded:", mp4Url);
    } catch (err) {
      console.error("[register-video] Transcode pipeline failed:", err?.message, err?.stack);
    } finally {
      await unlink(tmpIn).catch((e) => console.error("[register-video] unlink tmpIn:", e?.message));
      await unlink(tmpOut).catch((e) => console.error("[register-video] unlink tmpOut:", e?.message));
    }

    // 5. Update row with transcode result
    if (mp4Url) {
      try {
        const { error } = await supabase
          .from("videos")
          .update({ mp4_url: mp4Url, transcoded: true })
          .eq("id", videoRecord.id);
        if (error) console.error("[register-video] mp4_url update error:", error.message);
        else console.log("[register-video] Supabase row updated with mp4_url:", mp4Url);
      } catch (err) {
        console.error("[register-video] mp4_url update exception:", err?.message, err?.stack);
      }
    } else {
      console.warn("[register-video] Transcode produced no MP4 — row left with transcoded=false, viewer falls back to WebM");
    }
  }

  return Response.json({ shareLink, videoUrl: r2Url, videoId: videoRecord.id });
}
