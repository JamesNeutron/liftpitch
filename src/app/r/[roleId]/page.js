"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// Brand fallbacks — mirror the employer console defaults so a role with null
// colors still renders on-brand. brand_color = primary (buttons/accents),
// accent_color = headings/borders.
const DEFAULT_BRAND_COLOR = "#0A66C2";
const DEFAULT_ACCENT_COLOR = "#1A1A2E";
const SORA = "'Sora', sans-serif";
const DM = "'DM Sans', sans-serif";

// Parse a #rgb / #rrggbb brand color into channels so we can lay a low-opacity
// wash over white for the page background.
function hexToRgb(hex) {
  const h = (hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return { r: 26, g: 26, b: 46 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Pick a legible text color (near-black or white) for a given background by its
// perceived brightness — a light brand color (e.g. cyan #14d4e1) needs dark text.
function readableTextOn(hex) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return brightness > 0.6 ? "#1A1A2E" : "#ffffff";
}

const SECONDS_PER_QUESTION = 60;

// Same timer hook as the candidate dashboard recorder.
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

function Spinner({ color }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F4F7FB",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(0,0,0,0.08)", borderTopColor: color,
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PoweredBy() {
  return (
    <p style={{
      fontFamily: DM, fontSize: 12, color: "#8A97A6",
      textAlign: "center", margin: "32px 0 0",
    }}>
      Powered by{" "}
      <span style={{ fontWeight: 700, color: "#56687A" }}>LiftPitch</span>
    </p>
  );
}

function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#F4F7FB",
      fontFamily: DM, padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: "100%", background: "#fff", borderRadius: 20,
        padding: 36, textAlign: "center", border: "1px solid #E3E9F0",
        boxShadow: "0 2px 16px rgba(42,80,128,0.06)",
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
        <h1 style={{
          fontFamily: SORA, fontSize: 20, fontWeight: 800,
          color: "#1A1A2E", margin: "0 0 10px",
        }}>This link isn&apos;t valid</h1>
        <p style={{ fontSize: 14.5, color: "#56687A", lineHeight: 1.6, margin: 0 }}>
          The application link you followed may have expired or been mistyped.
          Try asking the employer for a fresh link.
        </p>
      </div>
      <PoweredBy />
    </div>
  );
}

export default function CandidateRecordPage() {
  const { roleId } = useParams();

  // Role load state.
  const [loadState, setLoadState] = useState("loading"); // loading | ready | notfound
  const [role, setRole] = useState(null);

  // Candidate-entered name — collected & held in state. NOT required in 3a;
  // enforcement ("name required before link generation") arrives in Stage 3b.
  const [name, setName] = useState("");

  // Recorder state machine — mirrors the dashboard recorder.
  const [state, setState] = useState("idle"); // idle | previewing | countdown | recording | preview | accepted
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const pendingBlobRef = useRef(null);
  const acceptedBlobRef = useRef(null); // the take the candidate kept — used in 3b
  const streamRef = useRef(null);

  // Questions drive the on-screen guide and the total timer.
  const questions = role
    ? [role.question_1, role.question_2].filter(q => q && q.trim())
    : [];
  const maxDur = Math.max(1, questions.length) * SECONDS_PER_QUESTION;
  const timer = useTimer(maxDur);

  const brandColor = role?.brand_color || DEFAULT_BRAND_COLOR;
  const accentColor = role?.accent_color || DEFAULT_ACCENT_COLOR;
  const companyName = role?.company_name || "This company";

  // Page background: a soft wash of the accent over white — tinted but light
  // enough that the white cards stay legible.
  const { r, g, b } = hexToRgb(accentColor);
  const pageBg = `linear-gradient(rgba(${r},${g},${b},0.12), rgba(${r},${g},${b},0.12)), #ffffff`;
  // Legible header/badge text — survives light brand or accent colors.
  const headerText = readableTextOn(brandColor);
  const headerSubText = headerText === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(26,26,46,0.75)";
  const badgeText = readableTextOn(accentColor);

  // Public, no-session read of a single role by id. Goes through the
  // get_recording_role(uuid) SECURITY DEFINER function (granted to anon) rather
  // than a direct table select: the roles table is owner-only, so the function
  // is what lets a candidate load one role by its UUID without exposing the
  // table to anonymous enumeration.
  useEffect(() => {
    let cancelled = false;
    async function loadRole() {
      if (!roleId) { setLoadState("notfound"); return; }
      try {
        const { data, error } = await supabase
          .rpc("get_recording_role", { role_id: roleId });
        if (cancelled) return;
        const row = data?.[0];
        if (error || !row) {
          // Surface the real reason — a swallowed PostgREST error is otherwise
          // indistinguishable from a genuinely bad link.
          if (error) console.error("[/r] role load failed:", error.message, error);
          setLoadState("notfound");
          return;
        }
        setRole(row);
        setLoadState("ready");
      } catch (err) {
        console.error("[/r] role load threw:", err);
        if (!cancelled) setLoadState("notfound");
      }
    }
    loadRole();
    return () => { cancelled = true; };
  }, [roleId]);

  // Stop any live camera tracks on unmount.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

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
      pendingBlobRef.current = { blob, url };
      setState("preview");
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = url; videoRef.current.muted = false; }
    };
    mr.start();
    mrRef.current = mr;
    timer.start();
    setState("recording");
  };

  const stopRec = () => { mrRef.current?.stop(); timer.stop(); };

  // Auto-stop when the total time is reached.
  useEffect(() => {
    if (timer.sec >= maxDur && state === "recording") stopRec();
  }, [timer.sec, maxDur, state]);

  // "Record again" — discard the take and restart the camera.
  const redo = () => {
    if (pendingBlobRef.current) { URL.revokeObjectURL(pendingBlobRef.current.url); pendingBlobRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    chunksRef.current = [];
    mrRef.current = null;
    timer.reset();
    setState("idle");
    setTimeout(() => startCamera(), 200);
  };

  // "Use this take" — keep the blob in state and STOP (Stage 3a ends here).
  const acceptTake = () => {
    if (!pendingBlobRef.current) return;
    acceptedBlobRef.current = pendingBlobRef.current;
    pendingBlobRef.current = null;
    setState("accepted");
  };

  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loadState === "loading") return <Spinner color={DEFAULT_BRAND_COLOR} />;
  if (loadState === "notfound") return <NotFound />;

  return (
    <div style={{
      minHeight: "100vh", background: pageBg, fontFamily: DM,
      paddingBottom: 48,
    }}>
      {/* Branded header bar */}
      <header style={{
        background: brandColor, padding: "20px 24px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            fontFamily: SORA, fontSize: 13, fontWeight: 600,
            color: headerSubText, letterSpacing: "0.04em",
          }}>
            {companyName} · {role.role_title} Application
          </div>
          <h1 style={{
            fontFamily: SORA, fontSize: 24, fontWeight: 800,
            color: headerText, margin: "6px 0 0",
          }}>
            Record your video pitch.
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 0" }}>
        {/* Questions guide */}
        <div style={{
          background: "#fff", border: `1px solid #E3E9F0`, borderRadius: 16,
          padding: 24, marginBottom: 20,
          boxShadow: "0 2px 12px rgba(42,80,128,0.05)",
        }}>
          <div style={{
            fontFamily: SORA, fontSize: 11, fontWeight: 700, color: brandColor,
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14,
          }}>
            {questions.length > 1 ? "Answer these questions" : "Your prompt"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
                  background: accentColor, color: badgeText, fontFamily: SORA,
                  fontSize: 12, fontWeight: 700, display: "flex",
                  alignItems: "center", justifyContent: "center", marginTop: 1,
                }}>{i + 1}</div>
                <p style={{
                  margin: 0, fontFamily: DM, fontSize: 15.5, color: "#1A1A2E",
                  lineHeight: 1.55,
                }}>{q}</p>
              </div>
            ))}
          </div>
          <p style={{
            margin: "16px 0 0", fontFamily: DM, fontSize: 13, color: "#56687A",
          }}>
            One continuous take · {fmt(maxDur)} total
            {questions.length > 1 ? ` (${SECONDS_PER_QUESTION}s per question)` : ""}.
          </p>
        </div>

        {/* Name field — collected now, required in Stage 3b. Does NOT gate the camera. */}
        <div style={{
          background: "#fff", border: `1px solid #E3E9F0`, borderRadius: 16,
          padding: 24, marginBottom: 20,
          boxShadow: "0 2px 12px rgba(42,80,128,0.05)",
        }}>
          <label htmlFor="candidate-name" style={{
            fontFamily: SORA, fontSize: 12, fontWeight: 700, color: brandColor,
            textTransform: "uppercase", letterSpacing: "0.1em", display: "block",
            marginBottom: 10,
          }}>Your name</label>
          <input
            id="candidate-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jordan Rivera"
            style={{
              width: "100%", padding: "14px 16px", boxSizing: "border-box",
              border: `1.5px solid #D6DEE8`, borderRadius: 12,
              fontFamily: DM, fontSize: 15, color: "#1A1A2E", background: "#F7FAFD",
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = brandColor; }}
            onBlur={e => { e.target.style.borderColor = "#D6DEE8"; }}
          />
        </div>

        {/* Recorder card */}
        <div style={{
          background: "#fff", border: `1px solid #E3E9F0`, borderRadius: 16,
          padding: 24, boxShadow: "0 2px 12px rgba(42,80,128,0.05)",
        }}>
          {/* Video viewport */}
          <div style={{
            position: "relative", borderRadius: 14, overflow: "hidden",
            background: "#000", aspectRatio: "16/9", marginBottom: 20,
            border: state === "recording"
              ? "2px solid #DC3545"
              : state === "countdown"
              ? "2px solid #E7A33E"
              : "1px solid #2A3A4D",
          }}>
            <video
              ref={videoRef}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                display: state === "idle" || state === "accepted" ? "none" : "block",
                transform: state !== "preview" ? "scaleX(-1)" : "none",
              }}
              playsInline
              controls={state === "preview"}
            />

            {(state === "idle" || state === "accepted") && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", background: "#0D1825",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>
                  {state === "accepted" ? "✅" : "📹"}
                </div>
                {cameraError
                  ? <span style={{ fontFamily: DM, fontSize: 13, color: "#FF8A80", textAlign: "center", padding: "0 16px" }}>{cameraError}</span>
                  : <span style={{ fontFamily: DM, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                      {state === "accepted" ? "Take saved" : "Click below to start your camera"}
                    </span>
                }
              </div>
            )}

            {/* On-screen prompt guide during recording */}
            {state === "recording" && questions.length > 0 && (
              <div style={{
                position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 8,
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  fontFamily: SORA, fontSize: 10, fontWeight: 700,
                  color: "rgba(255,255,255,0.55)", textTransform: "uppercase",
                  letterSpacing: "0.1em", marginBottom: 6,
                }}>
                  {questions.length > 1 ? "Cover these" : "Your prompt"}
                </div>
                {questions.map((q, i) => (
                  <p key={i} style={{
                    margin: i === 0 ? 0 : "6px 0 0", fontFamily: DM, fontSize: 13.5,
                    color: "rgba(255,255,255,0.92)", lineHeight: 1.45,
                  }}>
                    {questions.length > 1 ? `${i + 1}. ` : ""}{q}
                  </p>
                ))}
              </div>
            )}

            {state === "countdown" && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 10,
              }}>
                <div style={{
                  fontFamily: SORA, fontSize: 96, fontWeight: 800, color: "#fff",
                  animation: "countPulse 1s ease-in-out infinite",
                }}>{countdown}</div>
              </div>
            )}

            {state === "recording" && (
              <div style={{
                position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center",
                gap: 8, padding: "8px 16px", borderRadius: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC3545", animation: "pulse 1.2s ease-in-out infinite" }} />
                <span style={{ fontFamily: SORA, fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  {fmt(timer.sec)} / {fmt(maxDur)}
                </span>
              </div>
            )}

            {state === "recording" && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.12)" }}>
                <div style={{
                  height: "100%", width: `${(timer.sec / maxDur) * 100}%`,
                  background: timer.sec > maxDur * 0.8 ? "#E7A33E" : brandColor,
                  transition: "width 1s linear",
                }} />
              </div>
            )}
          </div>

          {/* Preview helper text */}
          {state === "preview" && (
            <p style={{ fontFamily: DM, fontSize: 14, color: "#56687A", margin: "0 0 12px", textAlign: "center" }}>
              How did that go? Watch your take and decide.
            </p>
          )}

          {/* Controls */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {state === "idle" && (
              <button onClick={startCamera} style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: brandColor, color: "#fff",
                fontFamily: SORA, fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>📷 Open Camera</button>
            )}
            {state === "previewing" && (
              <button onClick={startCountdown} style={{
                padding: "14px 32px", borderRadius: 12, border: "none",
                background: brandColor, color: "#fff",
                fontFamily: SORA, fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>⏺ Start Recording</button>
            )}
            {state === "recording" && (
              <button onClick={stopRec} style={{
                padding: "14px 32px", borderRadius: 12, border: "1.5px solid #D6DEE8",
                background: "#fff", color: "#1A1A2E",
                fontFamily: SORA, fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>⏹ Stop Recording</button>
            )}
            {state === "preview" && (
              <>
                <button onClick={redo} style={{
                  padding: "14px 32px", borderRadius: 12, border: "1.5px solid #D6DEE8",
                  background: "#fff", color: "#1A1A2E",
                  fontFamily: SORA, fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}>🔄 Record Again</button>
                <button onClick={acceptTake} style={{
                  padding: "14px 32px", borderRadius: 12, border: "none",
                  background: brandColor, color: "#fff",
                  fontFamily: SORA, fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>✅ Use This Take</button>
              </>
            )}
          </div>

          {/* Stage 3a stops here — placeholder after a take is accepted. */}
          {state === "accepted" && (
            <div style={{
              marginTop: 4, padding: 20, borderRadius: 14,
              background: "rgba(5,118,66,0.05)", border: "1px solid rgba(5,118,66,0.18)",
            }}>
              <div style={{
                fontFamily: SORA, fontSize: 13, fontWeight: 700, color: "#057642",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>✓</span> Take saved
              </div>
              <p style={{ fontFamily: DM, fontSize: 14, color: "#56687A", margin: "8px 0 16px", lineHeight: 1.55 }}>
                Your video is ready. Next step coming soon — you&apos;ll add your details and
                get a shareable link to send {companyName}.
              </p>
              <button onClick={redo} style={{
                padding: "10px 22px", borderRadius: 10, border: "1.5px solid #D6DEE8",
                background: "#fff", color: "#1A1A2E",
                fontFamily: SORA, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>🔄 Record a different take</button>
            </div>
          )}
        </div>

        <PoweredBy />
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)} }
        @keyframes countPulse { 0%{transform:scale(.8);opacity:.5}50%{transform:scale(1.1);opacity:1}100%{transform:scale(.8);opacity:.5} }
      `}</style>
    </div>
  );
}
