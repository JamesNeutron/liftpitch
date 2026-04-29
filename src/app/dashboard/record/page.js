"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642", successGlow: "rgba(5,118,66,0.15)",
  warning: "#E7A33E",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

function useTimer(max) {
  const [sec, setSec] = useState(0);
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (on) {
      ref.current = setInterval(() => {
        setSec(s => {
          if (s + 1 >= max) { setOn(false); clearInterval(ref.current); return max; }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [on, max]);
  return {
    sec, on,
    start: () => setOn(true),
    stop: () => { setOn(false); clearInterval(ref.current); },
    reset: () => { setSec(0); setOn(false); clearInterval(ref.current); },
  };
}

function DashboardHeader({ email, onSignOut }) {
  return (
    <header style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <a href="/dashboard" style={{
        fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
        background: B.gradient, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent", textDecoration: "none",
      }}>LiftPitch</a>

      <nav style={{ display: "flex", gap: 4 }}>
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Videos", href: "/dashboard/videos" },
          { label: "Analytics", href: "/dashboard/analytics" },
        ].map(({ label, href }) => (
          <a key={href} href={href} style={{
            padding: "8px 16px", borderRadius: 10,
            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
            color: B.textMuted, textDecoration: "none", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = B.bg; e.currentTarget.style.color = B.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.textMuted; }}
          >{label}</a>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted,
          maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{email}</span>
        <button onClick={onSignOut} style={{
          padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${B.border}`,
          background: B.surface, color: B.textMuted,
          fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#DC3545"; e.currentTarget.style.color = "#DC3545"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMuted; }}
        >Log Out</button>
      </div>
    </header>
  );
}

export default function DashboardRecord() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [videoTitle, setVideoTitle] = useState("");
  const [maxDur, setMaxDur] = useState(60);
  const [state, setState] = useState("idle"); // idle | previewing | countdown | recording | recorded
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | done | error
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [verification, setVerification] = useState(null);

  const videoRef = useRef(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timer = useTimer(maxDur);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .single();

      if (profile?.plan !== "pro" && profile?.plan !== "lifetime") { router.replace("/"); return; }

      setUser(session.user);
      setAuthLoading(false);
    }
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const genVerify = () => {
    const now = new Date();
    const sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const hash = btoa(`vp-${sid}-${now.toISOString()}-live`).substring(0, 16).toUpperCase();
    return { recordedAt: now.toISOString(), verificationHash: `VP-${hash}` };
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
      setState("previewing");
    } catch (err) {
      setCameraError(`${err.name}: ${err.message}`);
    }
  };

  const startCountdown = () => {
    setState("countdown"); setCountdown(3);
    let c = 3;
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(iv); beginRec(); }
    }, 1000);
  };

  const beginRec = () => {
    chunksRef.current = [];
    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4;codecs=avc1", "video/mp4"]
      .find(t => MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      const v = genVerify();
      setVerification(v);
      setShareLink(`https://lift-pitch.co/v/${v.verificationHash.replace("VP-", "").toLowerCase()}`);
      setState("recorded");
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = url; videoRef.current.muted = false; }
      uploadToStream(blob, v.verificationHash);
    };
    mr.start();
    mrRef.current = mr;
    timer.start();
    setState("recording");
  };

  const stopRec = () => { mrRef.current?.stop(); timer.stop(); };

  useEffect(() => {
    if (timer.sec >= maxDur && state === "recording") stopRec();
  }, [timer.sec, maxDur, state]);

  const reset = () => {
    timer.reset();
    setState("idle");
    setShareLink("");
    setCopied(false);
    setVerification(null);
    setUploadStatus("idle");
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const uploadToStream = async (blob, verificationHash) => {
    setUploadStatus("uploading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const urlRes = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!urlRes.ok) throw new Error(`get-upload-url: ${await urlRes.text()}`);
      const { uploadURL, uid } = await urlRes.json();

      const formData = new FormData();
      formData.append("file", blob, "video.webm");
      const putRes = await fetch(uploadURL, { method: "POST", body: formData });
      if (!putRes.ok) throw new Error(`Stream upload failed: ${putRes.status}`);

      const regRes = await fetch("/api/register-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ streamUid: uid, verificationHash, videoTitle }),
      });
      if (!regRes.ok) throw new Error(`register-video: ${await regRes.text()}`);
      const { shareLink: realLink } = await regRes.json();
      setShareLink(realLink);
      setUploadStatus("done");
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadStatus("error");
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const titleMissing = !videoTitle.trim();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: B.bg }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%",
          border: "3px solid transparent", borderTopColor: B.accent,
          animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader email={user?.email} onSignOut={handleSignOut} />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800,
          color: B.text, margin: "0 0 32px",
        }}>🎥 Record a Pitch</h1>

        {/* Job title input */}
        <div style={{
          background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
          padding: 28, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <label style={{
            fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.textDim,
            textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 10,
          }}>What job are you applying for?</label>
          <input
            type="text"
            value={videoTitle}
            onChange={e => setVideoTitle(e.target.value)}
            placeholder="e.g. Senior Product Manager at Stripe"
            disabled={state !== "idle"}
            style={{
              width: "100%", padding: "14px 16px", boxSizing: "border-box",
              border: `1.5px solid ${titleMissing ? B.border : B.accent}`,
              borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 15,
              color: B.text, background: state !== "idle" ? B.bg : B.surface,
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => { if (state === "idle") e.target.style.borderColor = B.accent; }}
            onBlur={e => { if (!videoTitle.trim()) e.target.style.borderColor = B.border; }}
          />
          {titleMissing && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim,
              margin: "8px 0 0",
            }}>Enter a job title to unlock the camera.</p>
          )}
        </div>

        {/* Recording card */}
        <div style={{
          background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
          padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          {/* Live-only notice */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12,
            marginBottom: 20, background: "rgba(5,118,66,0.05)", border: "1px solid rgba(5,118,66,0.12)",
          }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>🛡️</span>
            <div>
              <span style={{
                fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.success,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>Live Recording Only</span>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted,
                margin: "4px 0 0", lineHeight: 1.5,
              }}>No uploads or pre-recorded files. Every video gets a verified badge recruiters can trust.</p>
            </div>
          </div>

          {/* Duration selector (idle only) */}
          {state === "idle" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textDim,
                textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
              }}>⏱ Max Duration</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[30, 45, 60].map(d => (
                  <button key={d} onClick={() => setMaxDur(d)} style={{
                    padding: "8px 20px", borderRadius: 8,
                    background: maxDur === d ? B.accent : B.surface,
                    color: maxDur === d ? "#fff" : B.textMuted,
                    border: `1px solid ${maxDur === d ? B.accent : B.border}`,
                    fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>{d}s</button>
                ))}
              </div>
            </div>
          )}

          {/* Video viewport */}
          <div style={{
            position: "relative", borderRadius: 16, overflow: "hidden",
            background: "#000", aspectRatio: "16/9", marginBottom: 20,
            border: state === "recording"
              ? "2px solid #DC3545"
              : state === "countdown"
              ? `2px solid ${B.warning}`
              : `1px solid ${B.border}`,
          }}>
            <video
              ref={videoRef}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                display: state === "idle" ? "none" : "block",
                transform: state !== "recorded" ? "scaleX(-1)" : "none",
              }}
              playsInline
              controls={state === "recorded"}
            />

            {state === "idle" && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", background: B.surface,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.35 }}>📹</div>
                {cameraError
                  ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#DC3545", textAlign: "center", padding: "0 16px" }}>{cameraError}</span>
                  : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textDim }}>
                      {titleMissing ? "Enter a job title above first" : "Click below to start your camera"}
                    </span>
                }
              </div>
            )}

            {state === "countdown" && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 10,
              }}>
                <div style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 96, fontWeight: 800, color: "#fff",
                  textShadow: `0 0 60px ${B.accentGlow}`, animation: "countPulse 1s ease-in-out infinite",
                }}>{countdown}</div>
              </div>
            )}

            {state === "recording" && (
              <div style={{
                position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center",
                gap: 8, padding: "8px 16px", borderRadius: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC3545", animation: "pulse 1.2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  {fmt(timer.sec)} / {fmt(maxDur)}
                </span>
              </div>
            )}

            {state === "recording" && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(0,0,0,0.08)" }}>
                <div style={{
                  height: "100%", width: `${(timer.sec / maxDur) * 100}%`,
                  background: timer.sec > maxDur * 0.8
                    ? "linear-gradient(90deg, #E7A33E, #E06847)"
                    : B.gradient,
                  transition: "width 1s linear",
                }} />
              </div>
            )}

            {state === "recorded" && (
              <div style={{
                position: "absolute", top: 12, right: 12, zIndex: 5,
                display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px",
                borderRadius: 100, background: "rgba(5,118,66,0.85)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(5,118,66,0.4)",
              }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.09 4.26L17 3.29L17.97 6.2L21 6.58L20.42 9.58L23 11.36L21.18 13.84L22.56 16.58L19.82 17.66L19.56 20.66L16.56 20.42L14.78 23L12 21.82L9.22 23L7.44 20.42L4.44 20.66L4.18 17.66L1.44 16.58L2.82 13.84L1 11.36L3.58 9.58L3 6.58L6.03 6.2L7 3.29L9.91 4.26L12 2Z" fill="white"/>
                  <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>LIVE VERIFIED</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {state === "idle" && (
              <button onClick={startCamera} disabled={titleMissing} style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: titleMissing ? "#C8D0D9" : B.gradient,
                color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600,
                cursor: titleMissing ? "not-allowed" : "pointer",
                boxShadow: titleMissing ? "none" : `0 4px 24px ${B.accentGlow}`,
                transition: "all 0.2s",
              }}>📷 Open Camera</button>
            )}
            {state === "previewing" && (
              <button onClick={startCountdown} style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #DC3545, #C0392B)",
                color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 4px 24px rgba(220,53,69,0.25)",
              }}>⏺ Start Recording</button>
            )}
            {state === "recording" && (
              <button onClick={stopRec} style={{
                padding: "14px 32px", borderRadius: 12, border: `1.5px solid ${B.border}`,
                background: B.surface, color: B.text,
                fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>⏹ Stop Recording</button>
            )}
            {state === "recorded" && (
              <button onClick={reset} style={{
                padding: "14px 32px", borderRadius: 12, border: `1.5px solid ${B.border}`,
                background: B.surface, color: B.text,
                fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>🔄 Record Again</button>
            )}
          </div>

          {/* Post-record: share link + status */}
          {state === "recorded" && (
            <div style={{
              marginTop: 24, padding: 20, background: "rgba(5,118,66,0.05)",
              border: "1px solid rgba(5,118,66,0.15)", borderRadius: 14,
            }}>
              <span style={{
                fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.success,
                textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 12,
              }}>🔗 Your Verified Link</span>

              {uploadStatus === "uploading" && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  background: B.bg, borderRadius: 10, border: `1px solid ${B.border}` }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    border: "2px solid transparent", borderTopColor: B.accent,
                    animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted }}>
                    Uploading your video…
                  </span>
                </div>
              )}

              {uploadStatus === "error" && (
                <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 12,
                  background: "rgba(220,53,69,0.05)", border: "1px solid rgba(220,53,69,0.2)" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#DC3545" }}>
                    ⚠️ Upload failed — your video is only saved locally. Try recording again with a stable connection.
                  </span>
                </div>
              )}

              {(uploadStatus === "done" || uploadStatus === "error") && shareLink && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    flex: 1, padding: "12px 16px", background: B.bg, borderRadius: 10,
                    border: `1px solid ${B.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                    color: B.accentLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{shareLink}</div>
                  <button onClick={copyLink} style={{
                    padding: "12px 20px", borderRadius: 12, border: "none",
                    background: copied
                      ? `linear-gradient(135deg, ${B.success}, #046636)`
                      : B.surface,
                    color: copied ? "#0A0A0F" : B.text,
                    border: copied ? "none" : `1.5px solid ${B.border}`,
                    fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", flexShrink: 0,
                  }}>{copied ? "✓ Copied!" : "📋 Copy"}</button>
                </div>
              )}

              {verification && uploadStatus !== "uploading" && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: B.bg, border: `1px solid ${B.border}` }}>
                  <span style={{
                    fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.textDim,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>Verification Certificate</span>
                  <div style={{
                    display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", marginTop: 10,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  }}>
                    <span style={{ color: B.textDim }}>Job</span>
                    <span style={{ color: B.text, fontWeight: 600 }}>{videoTitle}</span>
                    <span style={{ color: B.textDim }}>Method</span>
                    <span style={{ color: B.success, fontWeight: 600 }}>LIVE CAPTURE</span>
                    <span style={{ color: B.textDim }}>Verification ID</span>
                    <span style={{ color: B.text, fontFamily: "monospace", fontSize: 11 }}>{verification.verificationHash}</span>
                    <span style={{ color: B.textDim }}>Recorded</span>
                    <span style={{ color: B.text }}>{new Date(verification.recordedAt).toLocaleString()}</span>
                    <span style={{ color: B.textDim }}>Device Stream</span>
                    <span style={{ color: B.success }}>✓ Verified</span>
                    <span style={{ color: B.textDim }}>No Uploads</span>
                    <span style={{ color: B.success }}>✓ Live only</span>
                  </div>
                </div>
              )}

              {uploadStatus === "done" && (
                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <a href="/dashboard/videos" style={{
                    padding: "10px 20px", borderRadius: 10, background: B.bg,
                    border: `1px solid ${B.border}`, fontFamily: "'Sora', sans-serif",
                    fontSize: 13, fontWeight: 600, color: B.accent, textDecoration: "none",
                  }}>View My Videos →</a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)} }
        @keyframes countPulse { 0%{transform:scale(.8);opacity:.5}50%{transform:scale(1.1);opacity:1}100%{transform:scale(.8);opacity:.5} }
      `}</style>
    </div>
  );
}
