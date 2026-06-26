"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// Brand palette — mirrors /employers so this page feels native.
const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642", danger: "#DC3545", coral: "#E06847",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

const SORA = "'Sora', sans-serif";
const DM = "'DM Sans', sans-serif";

const CHECKLIST = [
  "Free during the pilot — no credit card",
  "Works inside the ATS you already use",
  "See verified, on-camera candidates",
];

export default function EmployerSignup() {
  const router = useRouter();
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password || loading) return;
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({
          email,
          password,
          // Future-proof metadata in case a DB trigger reads it; the explicit
          // update below is what actually tags the profile today.
          options: { data: { account_type: "employer" } },
        });
        if (e) throw e;

        // Email confirmation is OFF, so signUp returns a live session and the
        // profiles row already exists (created synchronously by the
        // handle_new_user trigger). Tag it as an employer.
        const userId = data?.user?.id;
        if (userId) {
          const { error: upErr } = await supabase
            .from("profiles")
            .update({ account_type: "employer" })
            .eq("id", userId);
          if (upErr) throw upErr;
        }
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
      }
      router.replace("/employers/console");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", boxSizing: "border-box",
    border: `1px solid ${B.border}`, borderRadius: 10,
    fontFamily: DM, fontSize: 15, color: B.text,
    background: "#FFFFFF", outline: "none", transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text, fontFamily: DM }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/" style={{
          fontFamily: SORA, fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", textDecoration: "none",
        }}>LiftPitch</a>
        <a href="/employers/pricing" style={{
          fontFamily: SORA, fontSize: 13, fontWeight: 600, color: B.textMuted, textDecoration: "none",
        }}>Pricing</a>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "clamp(40px, 7vw, 80px) 24px" }}>
        <div style={{
          display: "grid", gap: "clamp(32px, 5vw, 56px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          alignItems: "center",
        }}>
          {/* Left: pitch */}
          <div>
              <div style={{
                fontFamily: SORA, fontSize: 12.5, fontWeight: 700, color: B.accent,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16,
              }}>For Employers</div>
              <h1 style={{
                fontFamily: SORA, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800,
                lineHeight: 1.12, letterSpacing: "-0.02em", margin: "0 0 18px", color: B.text,
              }}>
                {mode === "signup" ? "Start your free pilot." : "Welcome back."}
              </h1>
              <p style={{
                fontFamily: DM, fontSize: 16.5, color: B.textMuted, lineHeight: 1.6,
                margin: "0 0 28px", maxWidth: 420,
              }}>
                {mode === "signup"
                  ? "Create your employer account and meet the real people behind your applications — before you spend a single screening call."
                  : "Sign in to your employer account to manage your pilot."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {CHECKLIST.map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(5,118,66,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                        stroke={B.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ fontFamily: DM, fontSize: 15, color: B.textMuted }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: auth card */}
            <div style={{
              background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
              padding: "clamp(28px, 4vw, 38px)",
              boxShadow: "0 12px 40px rgba(42,80,128,0.10)",
            }}>
              <h2 style={{ fontFamily: SORA, fontSize: 21, fontWeight: 700, color: B.text, margin: "0 0 6px" }}>
                {mode === "signup" ? "Create employer account" : "Employer sign in"}
              </h2>
              <p style={{ fontFamily: DM, fontSize: 14, color: B.textMuted, margin: "0 0 24px" }}>
                {mode === "signup" ? "No card required during the pilot." : "Sign in to continue."}
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
                  textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                  Work email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = B.accent}
                  onBlur={e => e.target.style.borderColor = B.border}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
                  textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                  Password
                </label>
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
                  <span style={{ fontFamily: DM, fontSize: 13, color: B.danger }}>{error}</span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading || !email || !password} style={{
                width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
                background: (!loading && email && password) ? B.gradient : "#C8D0D9",
                color: "#fff", fontFamily: SORA, fontSize: 16, fontWeight: 700,
                cursor: (loading || !email || !password) ? "not-allowed" : "pointer",
                boxShadow: (!loading && email && password) ? `0 4px 20px ${B.accentGlow}` : "none",
                transition: "all 0.2s",
              }}>
                {loading ? "Please wait…" : mode === "signup" ? "Start Free Pilot" : "Sign In"}
              </button>

              <p style={{ textAlign: "center", marginTop: 18, fontFamily: DM, fontSize: 14, color: B.textMuted }}>
                {mode === "signup" ? "Already have an account? " : "Need an employer account? "}
                <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} style={{
                  background: "none", border: "none", color: B.accent,
                  fontFamily: DM, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0,
                }}>
                  {mode === "signup" ? "Sign in" : "Start free"}
                </button>
              </p>
            </div>
          </div>
      </main>
    </div>
  );
}
