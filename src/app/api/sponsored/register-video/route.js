import { createClient } from "@supabase/supabase-js";
import { pollStreamReady, streamMp4Url, getIpLocation, shareLinkFor } from "../../../../lib/stream";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Version of the consent copy shown on /r/[roleId]. Bump whenever that wording
// changes so each sponsored row records exactly what the candidate agreed to.
const CONSENT_VERSION = "2026-07-01";

// Short candidate-facing email with their share link. Fire-and-forget: any
// failure here must never block returning the link.
async function emailCandidateLink(to, shareLink, companyName) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[sponsored/register-video] RESEND_API_KEY not set — skipping email");
    return;
  }
  const company = companyName || "the employer";
  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#F5F7FA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1A1A2E;">
  <p style="font-size:16px;font-weight:700;margin:0 0 12px;">Your video pitch link is ready</p>
  <p style="font-size:14px;color:#56687A;line-height:1.6;margin:0 0 16px;">Paste this link into your application for ${company}:</p>
  <p style="margin:0 0 16px;"><a href="${shareLink}" style="font-size:15px;color:#0A66C2;font-weight:600;word-break:break-all;">${shareLink}</a></p>
  <p style="font-size:12px;color:#8FA4B8;margin:0;">Powered by LiftPitch</p>
</body></html>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LiftPitch <support@lift-pitch.co>",
        to: [to],
        subject: "Your video pitch link",
        html,
      }),
    });
    if (!res.ok) {
      console.error("[sponsored/register-video] Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("[sponsored/register-video] Resend fetch error", err?.message);
  }
}

export async function POST(request) {
  let roleId, streamUid, candidateName, candidateEmail;
  try {
    const body = await request.json();
    roleId = body.roleId;
    streamUid = body.streamUid;
    candidateName = (body.candidateName || "").trim();
    candidateEmail = (body.candidateEmail || "").trim() || null;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!roleId) return Response.json({ error: "Missing roleId" }, { status: 400 });
  if (!streamUid) return Response.json({ error: "Missing streamUid" }, { status: 400 });
  if (!candidateName) return Response.json({ error: "Missing candidateName" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Authoritative role snapshot — never trust client-sent company/role/question
  // text. Everything stored on the row comes from get_recording_role.
  const { data, error: roleError } = await supabase.rpc("get_recording_role", { role_id: roleId });
  const role = data?.[0];
  if (roleError || !role) {
    if (roleError) console.error("[sponsored/register-video] role load failed:", roleError.message);
    return Response.json({ error: "Role not found" }, { status: 404 });
  }

  const verificationHash = `VP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const ipLocation = await getIpLocation(request);

  let videoRecord;
  try {
    const { data: inserted, error } = await supabase
      .from("videos")
      .insert({
        user_id: null,
        is_sponsored: true,
        stream_uid: streamUid,
        verification_hash: verificationHash,
        transcoded: false,
        ip_location: ipLocation,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        consent_accepted_at: new Date().toISOString(),
        consent_version: CONSENT_VERSION,
        role_id: roleId,
        company_name: role.company_name,
        role_name: role.role_title,
        question_1: role.question_1,
        question_2: role.question_2,
      })
      .select()
      .single();

    if (error) {
      console.error("[sponsored/register-video] insert error:", error.message);
      return Response.json({ error: "Failed to save video record", detail: error.message }, { status: 500 });
    }
    videoRecord = inserted;
  } catch (err) {
    console.error("[sponsored/register-video] insert exception:", err?.message);
    return Response.json({ error: "Failed to save video record", detail: String(err) }, { status: 500 });
  }

  const shareLink = shareLinkFor(videoRecord.id);
  try {
    const { error } = await supabase.from("videos").update({ share_link: shareLink }).eq("id", videoRecord.id);
    if (error) console.error("[sponsored/register-video] share_link update error:", error.message);
  } catch (err) {
    console.error("[sponsored/register-video] share_link update exception:", err?.message);
  }

  // Poll Stream until ready, then persist the playback URL.
  const streamResult = await pollStreamReady(streamUid);
  if (streamResult) {
    try {
      const { error } = await supabase
        .from("videos")
        .update({ mp4_url: streamMp4Url(streamUid), transcoded: true })
        .eq("id", videoRecord.id);
      if (error) console.error("[sponsored/register-video] mp4_url update error:", error.message);
    } catch (err) {
      console.error("[sponsored/register-video] mp4_url update exception:", err?.message);
    }
  } else {
    console.warn("[sponsored/register-video] Stream not ready within timeout — row left transcoded=false");
  }

  if (candidateEmail) {
    await emailCandidateLink(candidateEmail, shareLink, role.company_name);
  }

  return Response.json({ shareLink, videoId: videoRecord.id });
}
