"use client";

import { useState, useEffect, useRef } from "react";
import { Stream } from "@cloudflare/stream-react";
import { supabase } from "../../../lib/supabase";

const B = {
  accent: "#0A66C2", accentLight: "#378FE9",
  success: "#057642", warning: "#E7A33E",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  border: "#E2E8F0", bg: "#F5F7FA", surface: "#FFFFFF",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

export default function VideoPage({ params }) {
  const { id } = params;
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const viewLoggedRef = useRef(false);
  const videoRef = useRef(null);
  const watchStartRef = useRef(null);

  useEffect(() => {
    async function load() {
      let data;
      try {
        const res = await fetch(`/api/video/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } catch (err) {
        console.error("Failed to load video:", err);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!data.stream_uid && !data.r2_url) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setVideo(data);
      setLoading(false);

      if (!data.transcoded) {
        setShowProcessing(true);
        setTimeout(() => setShowProcessing(false), 4000);
      }
    }

    load();
  }, [id]);

  const handlePlay = async () => {
    watchStartRef.current = Date.now();
    if (!viewLoggedRef.current && id) {
      viewLoggedRef.current = true;
      try {
        await supabase.from("video_views").insert({ video_id: id });
      } catch (_) {}
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: B.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%",
            border: "3px solid transparent", borderTopColor: B.accent,
            animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: B.textMuted, margin: 0 }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: B.bg, padding: "0 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎥</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700,
            color: B.text, margin: "0 0 10px" }}>Video Not Found</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.textMuted,
            lineHeight: 1.6, margin: "0 0 28px" }}>
            This pitch link may have expired or been removed.
          </p>
          <a href="/" style={{ display: "inline-block", padding: "12px 32px", borderRadius: 12,
            background: B.gradient, color: "#fff", textDecoration: "none",
            fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700 }}>
            Create Your Own Pitch →
          </a>
        </div>
      </div>
    );
  }

  const recordedDate = new Date(video.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ── Video player ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/" style={{
          fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", textDecoration: "none",
        }}>LiftPitch</a>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px",
          borderRadius: 100, background: "rgba(5,118,66,0.08)", border: "1px solid rgba(5,118,66,0.2)",
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.09 4.26L17 3.29L17.97 6.2L21 6.58L20.42 9.58L23 11.36L21.18 13.84L22.56 16.58L19.82 17.66L19.56 20.66L16.56 20.42L14.78 23L12 21.82L9.22 23L7.44 20.42L4.44 20.66L4.18 17.66L1.44 16.58L2.82 13.84L1 11.36L3.58 9.58L3 6.58L6.03 6.2L7 3.29L9.91 4.26L12 2Z" fill="#057642"/>
            <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
            color: B.success, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Live Verified
          </span>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "40px auto 80px", padding: "0 20px" }}>

        {/* Video player */}
        <div style={{
          borderRadius: 20, overflow: "hidden", background: "#000",
          boxShadow: "0 16px 56px rgba(0,0,0,0.2)", position: "relative",
          aspectRatio: "16/9",
        }}>
          {video.stream_uid ? (
            <Stream
              src={video.stream_uid}
              controls
              responsive={false}
              onPlay={handlePlay}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          ) : (
            <video
              ref={videoRef}
              controls
              playsInline
              onPlay={handlePlay}
              style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
            >
              {video.mp4_url && video.transcoded
                ? <source src={video.mp4_url} type="video/mp4" />
                : <source src={video.r2_url} type="video/webm" />}
            </video>
          )}

          {showProcessing && (
            <div style={{
              position: "absolute", bottom: 14, left: 14, zIndex: 5,
              display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
              borderRadius: 100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)", pointerEvents: "none",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: B.warning, flexShrink: 0,
                animation: "pulse 1.4s ease-in-out infinite",
              }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                color: "rgba(255,255,255,0.85)" }}>
                Processing for all browsers — refresh in a moment
              </span>
            </div>
          )}

          {/* Verified overlay badge */}
          <div style={{
            position: "absolute", top: 14, right: 14, zIndex: 5,
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 13px",
            borderRadius: 100, background: "rgba(5,118,66,0.85)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(5,118,66,0.4)", pointerEvents: "none",
          }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.09 4.26L17 3.29L17.97 6.2L21 6.58L20.42 9.58L23 11.36L21.18 13.84L22.56 16.58L19.82 17.66L19.56 20.66L16.56 20.42L14.78 23L12 21.82L9.22 23L7.44 20.42L4.44 20.66L4.18 17.66L1.44 16.58L2.82 13.84L1 11.36L3.58 9.58L3 6.58L6.03 6.2L7 3.29L9.91 4.26L12 2Z" fill="white"/>
              <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700,
              color: "#fff", letterSpacing: "0.06em" }}>LIVE VERIFIED</span>
          </div>
        </div>

        {/* Metadata card */}
        <div style={{
          marginTop: 24, padding: 28, background: B.surface, borderRadius: 18,
          border: `1px solid ${B.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            flexWrap: "wrap", gap: 16, marginBottom: 20,
          }}>
            <div>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700,
                color: B.text, margin: "0 0 6px" }}>
                Verified Video Pitch
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: B.textMuted, margin: 0 }}>
                Recorded {recordedDate}
              </p>
            </div>

            {video.verification_hash && (
              <div style={{ padding: "10px 16px", borderRadius: 10, background: B.bg, border: `1px solid ${B.border}` }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 600,
                  color: B.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                  Verification ID
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: B.text, letterSpacing: "0.04em" }}>
                  {video.verification_hash}
                </div>
              </div>
            )}
          </div>

          {/* Cert grid */}
          <div style={{
            paddingTop: 20, borderTop: `1px solid ${B.border}`,
            display: "grid", gridTemplateColumns: "auto 1fr", gap: "9px 24px",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>
            <span style={{ color: B.textDim }}>Method</span>
            <span style={{ color: B.success, fontWeight: 600 }}>LIVE CAPTURE</span>

            <span style={{ color: B.textDim }}>Device Stream</span>
            <span style={{ color: B.success }}>✓ Verified from webcam</span>

            <span style={{ color: B.textDim }}>File Upload</span>
            <span style={{ color: "#E06847" }}>✗ Blocked — live recordings only</span>

            <span style={{ color: B.textDim }}>AI Video</span>
            <span style={{ color: "#E06847" }}>✗ Blocked — real person only</span>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 24, padding: "32px 28px", textAlign: "center",
          background: B.gradient, borderRadius: 18,
          boxShadow: "0 8px 32px rgba(10,102,194,0.25)",
        }}>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700,
            color: "#fff", margin: "0 0 8px" }}>
            Want to stand out the same way?
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: "rgba(255,255,255,0.85)", margin: "0 0 22px", lineHeight: 1.6 }}>
            Create your own verified video pitch — free, no account needed to start.
          </p>
          <a href="/" style={{
            display: "inline-block", padding: "13px 36px", borderRadius: 12,
            background: "#fff", color: B.accent, textDecoration: "none",
            fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}>
            Create My Pitch →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
