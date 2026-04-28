import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function pollStreamReady(uid, maxWaitMs = 55_000) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      { headers: { Authorization: `Bearer ${streamToken}` } }
    );
    if (!res.ok) {
      console.error("[register-video] Stream status check failed:", res.status);
      break;
    }
    const { result } = await res.json();
    console.log("[register-video] Stream status:", result.status?.state);
    if (result.status?.state === "ready") return result;
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}

export async function POST(request) {
  console.log("[register-video] POST received");

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
    console.error("[register-video] Auth exception:", err?.message);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let streamUid, verificationHash;
  try {
    const body = await request.json();
    streamUid = body.streamUid;
    verificationHash = body.verificationHash || "";
  } catch (err) {
    console.error("[register-video] Body parse error:", err?.message);
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!streamUid) {
    console.error("[register-video] Missing streamUid in body");
    return Response.json({ error: "Missing streamUid" }, { status: 400 });
  }
  console.log("[register-video] streamUid:", streamUid, "| verificationHash:", verificationHash);

  // Insert row immediately so share link can always be returned.
  let videoRecord;
  try {
    const { data, error } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        verification_hash: verificationHash,
        stream_uid: streamUid,
        transcoded: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[register-video] Supabase insert error:", error.message);
      return Response.json(
        { error: "Failed to save video record", detail: error.message },
        { status: 500 }
      );
    }
    videoRecord = data;
    console.log("[register-video] Supabase row created, id:", videoRecord.id);
  } catch (err) {
    console.error("[register-video] Supabase insert exception:", err?.message);
    return Response.json({ error: "Failed to save video record", detail: String(err) }, { status: 500 });
  }

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

  // Poll Stream until ready, then update the row.
  const streamResult = await pollStreamReady(streamUid);
  if (streamResult) {
    const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
    const mp4Url = `https://customer-${customerCode}.cloudflarestream.com/${streamUid}/manifest/video.m3u8`;
    try {
      const { error } = await supabase
        .from("videos")
        .update({ mp4_url: mp4Url, transcoded: true })
        .eq("id", videoRecord.id);
      if (error) console.error("[register-video] mp4_url update error:", error.message);
      else console.log("[register-video] Stream ready, mp4_url set:", mp4Url);
    } catch (err) {
      console.error("[register-video] mp4_url update exception:", err?.message);
    }
  } else {
    console.warn("[register-video] Stream not ready within timeout — row left with transcoded=false");
  }

  return Response.json({ shareLink, videoId: videoRecord.id });
}
