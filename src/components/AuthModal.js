"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

const B = {
  accent: "#0A66C2", accentGlow: "rgba(10,102,194,0.25)",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#7A8896",
  border: "#E2E8F0",
  gradientHot: "linear-gradient(135deg, #0A66C2 0%, #C8442A 100%)",
};

export default function AuthModal({ onClose, defaultMode = "signup" }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : "" },
    });
    if (e) { setError(e.message); setLoading(false); }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", boxSizing: "border-box",
    border: `1px solid ${B.border}`, borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.text,
    background: "#FFFFFF", outline: "none", transition: "border-color 0.2s",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 24, padding: "40px 36px 36px",
        maxWidth: 440, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "transparent", border: "none", fontSize: 18,
          cursor: "pointer", color: B.textDim, padding: "4px 8px", lineHeight: 1,
        }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800,
            background: B.gradientHot, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", marginBottom: 10,
          }}>LiftPitch</div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: B.text, margin: "0 0 6px" }}>
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: 0 }}>
            {mode === "signup" ? "Start recording verified pitches today." : "Sign in to continue recording."}
          </p>
        </div>

        {/* Google OAuth */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", padding: "13px 0", borderRadius: 12,
          background: "#FFFFFF", color: B.text, border: `1.5px solid ${B.border}`,
          fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 20, transition: "all 0.2s", opacity: loading ? 0.7 : 1,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = B.accent; e.currentTarget.style.boxShadow = `0 2px 8px ${B.accentGlow}`; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: B.border }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim }}>or</span>
          <div style={{ flex: 1, height: 1, background: B.border }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600,
            color: B.textDim, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" style={inputStyle}
            onFocus={e => e.target.style.borderColor = B.accent}
            onBlur={e => e.target.style.borderColor = B.border}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600,
            color: B.textDim, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Create a password (6+ characters)" : "Your password"}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = B.accent}
            onBlur={e => e.target.style.borderColor = B.border}
          />
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.2)" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#DC3545" }}>{error}</span>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || !email || !password} style={{
          width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
          background: (!loading && email && password) ? B.gradientHot : "#C8D0D9",
          color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700,
          cursor: (loading || !email || !password) ? "not-allowed" : "pointer",
          boxShadow: (!loading && email && password) ? "0 4px 20px rgba(224,104,71,0.3)" : "none",
          transition: "all 0.2s",
        }}>
          {loading ? "⏳ Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted }}>
          {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} style={{
            background: "none", border: "none", color: B.accent,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0,
          }}>
            {mode === "signup" ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
