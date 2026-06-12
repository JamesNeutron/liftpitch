export async function POST(request) {
  let userEmail, shareLink, verificationId;
  try {
    ({ userEmail, shareLink, verificationId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!userEmail || !shareLink) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("send-video-email: RESEND_API_KEY is not set");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0A66C2,#378FE9);padding:32px 40px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">LiftPitch</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Your verified video pitch</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A2E;">Your video is ready! 🎉</p>
              <p style="margin:0 0 24px;font-size:15px;color:#56687A;line-height:1.7;">
                Great work recording your pitch. Your verified link is live and ready to share with recruiters.
              </p>

              <!-- Link box -->
              <div style="background:#F5F7FA;border:1.5px solid #E2E8F0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                <div style="font-size:11px;font-weight:700;color:#8FA4B8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Your Verified Link</div>
                <a href="${shareLink}" style="font-size:15px;color:#0A66C2;word-break:break-all;text-decoration:none;font-weight:600;">${shareLink}</a>
              </div>

              <!-- CTA button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${shareLink}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0A66C2,#378FE9);color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;">Watch My Pitch →</a>
              </div>

              <!-- Instructions -->
              <div style="border-top:1px solid #E2E8F0;padding-top:24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A2E;">How to use your link:</p>
                <p style="margin:0 0 8px;font-size:14px;color:#56687A;line-height:1.6;">📄 <strong>Add it to your resume</strong> — paste the link next to your name or in your summary section.</p>
                <p style="margin:0 0 8px;font-size:14px;color:#56687A;line-height:1.6;">💼 <strong>Include it in applications</strong> — drop it into cover letters and LinkedIn messages.</p>
                <p style="margin:0;font-size:14px;color:#56687A;line-height:1.6;">✅ <strong>Recruiters see a verified badge</strong> — the badge confirms your video was recorded live, not AI-generated.</p>
              </div>

              ${verificationId ? `<div style="background:#F5F7FA;border-radius:8px;padding:12px 16px;margin-bottom:24px;"><span style="font-size:11px;font-weight:600;color:#8FA4B8;text-transform:uppercase;letter-spacing:0.08em;">Verification ID: </span><span style="font-size:12px;font-family:monospace;color:#1A1A2E;">${verificationId}</span></div>` : ""}

              <!-- Upgrade nudge -->
              <div style="background:linear-gradient(135deg,rgba(10,102,194,0.05),rgba(55,143,233,0.05));border:1px solid rgba(10,102,194,0.15);border-radius:12px;padding:20px 24px;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0A66C2;">Want to record more pitches?</p>
                <p style="margin:0 0 14px;font-size:13px;color:#56687A;line-height:1.6;">Upgrade to Pro for unlimited videos, no watermark, and full analytics. Starting at $8/month or $99 one-time.</p>
                <a href="https://lift-pitch.co/pricing" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#0A66C2,#E06847);color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700;">View Upgrade Options →</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F5F7FA;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#8FA4B8;">LiftPitch — Stand out before the interview.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#8FA4B8;"><a href="https://lift-pitch.co" style="color:#8FA4B8;">lift-pitch.co</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LiftPitch <support@lift-pitch.co>",
        to: [userEmail],
        subject: "Your LiftPitch Video is Ready!",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("send-video-email: Resend error", res.status, body);
      return Response.json({ error: "Email send failed" }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("send-video-email: fetch error", err);
    return Response.json({ error: "Network error" }, { status: 502 });
  }
}
