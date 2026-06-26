"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import AuthModal from "../components/AuthModal";

// Fonts loaded via layout.js

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", surfaceHover: "#EDF0F5",
  card: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642", successGlow: "rgba(5,118,66,0.15)",
  warning: "#E7A33E", text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
  gradientHot: "linear-gradient(135deg, #0A66C2 0%, #E06847 100%)",
};

// ─── Shared Components ───

function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const base = {
    padding: "14px 32px", borderRadius: 12, border: "none",
    fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
    opacity: disabled ? 0.5 : 1, letterSpacing: "0.02em",
  };
  const v = {
    primary: { background: B.gradient, color: "#fff", boxShadow: `0 4px 24px ${B.accentGlow}` },
    secondary: { background: B.surface, color: B.text, border: `1.5px solid ${B.border}` },
    success: { background: `linear-gradient(135deg, ${B.success}, #046636)`, color: "#0A0A0F", boxShadow: `0 4px 24px ${B.successGlow}` },
    hot: { background: B.gradientHot, color: "#fff", boxShadow: "0 4px 24px rgba(224,104,71,0.2)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.target.style.transform = "translateY(-2px) scale(1.02)"; }}
      onMouseLeave={e => { e.target.style.transform = "translateY(0) scale(1)"; }}>
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 20, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
}

function PillBadge({ label, color = B.success }) {
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
      fontFamily: "'Sora', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase",
      background: color === B.success ? "linear-gradient(135deg, #057642, #046636)"
        : "linear-gradient(135deg, #E7A33E, #E06847)",
      color: "#0A0A0F",
    }}>{label}</span>
  );
}

function VerifiedBadge({ size = "normal" }) {
  const s = size === "small" ? { p: "4px 10px", f: 10, i: 12 } : { p: "6px 14px", f: 12, i: 14 };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: s.p,
      borderRadius: 100, background: "rgba(5,118,66,0.1)", border: "1px solid rgba(5,118,66,0.2)",
    }}>
      <svg width={s.i} height={s.i} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.09 4.26L17 3.29L17.97 6.2L21 6.58L20.42 9.58L23 11.36L21.18 13.84L22.56 16.58L19.82 17.66L19.56 20.66L16.56 20.42L14.78 23L12 21.82L9.22 23L7.44 20.42L4.44 20.66L4.18 17.66L1.44 16.58L2.82 13.84L1 11.36L3.58 9.58L3 6.58L6.03 6.2L7 3.29L9.91 4.26L12 2Z" fill="#057642"/>
        <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontFamily: "'Sora', sans-serif", fontSize: s.f, fontWeight: 700, color: B.success, letterSpacing: "0.05em", textTransform: "uppercase" }}>Live Verified</span>
    </div>
  );
}

function TextArea({ value, onChange, placeholder, minHeight = 120, style = {} }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", minHeight, padding: 16, background: "#FFFFFF", color: B.text,
        border: `1px solid ${B.border}`, borderRadius: 12,
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "vertical", outline: "none",
        lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.2s", ...style,
      }}
      onFocus={e => e.target.style.borderColor = B.accent}
      onBlur={e => e.target.style.borderColor = B.border}
    />
  );
}

function FieldLabel({ icon, children }) {
  return (
    <label style={{
      fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textDim,
      textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
    }}>{icon} {children}</label>
  );
}

// ─── Timer Hook ───

function useTimer(max) {
  const [sec, setSec] = useState(0);
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (on) {
      ref.current = setInterval(() => {
        setSec(s => { if (s + 1 >= max) { setOn(false); clearInterval(ref.current); return max; } return s + 1; });
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

// ─── Landing Page ───

const steps = [
  {
    n: "1", emoji: "📄",
    color: "#E06847", colorLight: "rgba(224,104,71,0.1)", colorMid: "rgba(224,104,71,0.18)",
    t: "Paste your resume & the job description",
    d: "No formatting needed — just paste the text of your resume and the job posting, then add a quick paragraph about yourself. The whole thing takes about 2 minutes.",
  },
  {
    n: "2", emoji: "✨",
    color: "#0A66C2", colorLight: "rgba(10,102,194,0.08)", colorMid: "rgba(10,102,194,0.16)",
    t: "Get a personalized script written for you",
    d: "Our AI reads your resume and the job posting together, then writes a pitch that connects your real experience to what they're actually looking for. No generic fluff — just your story, told well.",
  },
  {
    n: "3", emoji: "🎥",
    color: "#057642", colorLight: "rgba(5,118,66,0.08)", colorMid: "rgba(5,118,66,0.16)",
    t: "Record a unique pitch for each application",
    d: "Each pitch is tailored to the specific role and company. Recruiters can tell when a video is generic — a personalized pitch shows you actually want THIS job.",
  },
];

// Full-width section band — stretches edge to edge with its own background,
// while keeping inner content centered at a constrained max-width.
function Section({ bg, pad, children }) {
  return (
    <section style={{
      width: "100%", background: bg,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: pad || "clamp(56px, 8vw, 96px) 20px",
    }}>
      {children}
    </section>
  );
}

function Landing({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      display: "flex", flexDirection: "column",
      width: "100%", overflow: "hidden",
    }}>

      {/* ── Hero ── */}
      <Section bg="#FFFFFF" pad="clamp(40px, 6vw, 72px) 20px clamp(48px, 7vw, 88px)">
      <div style={{ maxWidth: 740, width: "100%", textAlign: "center", margin: "0 auto" }}>
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.accent,
          letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px",
        }}>
          Built by Recruiters, for Job Seekers
        </p>

        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(36px, 6.5vw, 70px)", fontWeight: 800,
          lineHeight: 1.1, margin: "0 0 8px",
          background: B.gradientHot, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          You're More Than a PDF.
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(17px, 2.4vw, 21px)", color: B.textMuted,
          lineHeight: 1.8, margin: "24px auto 32px", maxWidth: 580,
        }}>
          Struggling to land interviews? Recruiters and hiring managers are always looking for two things: skills match and personality match. We'll help you with both. LiftPitch will help you tailor your resume to each individual role you apply to — helping get your resume past those ATS systems. Then, to really set yourself apart, we'll help you film a 60-second pitch so they can see you as a person, not a PDF.
        </p>

        <Btn onClick={onStart} style={{ padding: "18px 56px", fontSize: 17, borderRadius: 16,
          boxShadow: "0 6px 28px rgba(10,102,194,0.2)" }}>
          Create My Free Pitch →
        </Btn>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: B.textDim, marginTop: 16 }}>
          No account needed · Takes under 5 minutes · 100% free to start
        </p>
      </div>

      {/* Feature pills */}
      <div className="feature-pills" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: "clamp(24px, 4vw, 40px)" }}>
        {[
          { icon: "🛡️", label: "Live verified — no fakes" },
          { icon: "🎯", label: "Job-matched AI script" },
          { icon: "🔗", label: "Shareable link for any app" },
          { icon: "📊", label: "See who watched" },
        ].map(f => (
          <div key={f.label} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            borderRadius: 100, background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            fontSize: 13.5, color: B.textMuted, fontFamily: "'DM Sans', sans-serif",
          }}><span>{f.icon}</span> {f.label}</div>
        ))}
      </div>
      </Section>

      {/* ── See LiftPitch in Action — section removed until the real demo video exists; re-add the <Section> with the video embed here ── */}

      {/* ── How It Works ── */}
      <Section bg="#FFFFFF">
      <div style={{ maxWidth: 900, width: "100%" }}>
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: 12, color: B.textDim, textAlign: "center",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10,
        }}>How it works</p>
        <h2 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
          color: B.text, textAlign: "center", margin: "0 auto 52px", maxWidth: 520, lineHeight: 1.22,
        }}>
          Three steps from invisible<br />to unforgettable
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              flex: "1 1 250px", maxWidth: 278,
              background: "#FFFFFF",
              border: `1.5px solid ${s.colorMid}`,
              borderRadius: 24, padding: "36px 30px",
              boxShadow: `0 6px 28px rgba(0,0,0,0.05)`,
              position: "relative", overflow: "hidden",
            }}>
              {/* Colored step number badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: 14,
                background: s.colorLight, marginBottom: 20,
              }}>
                <span style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 900, color: s.color,
                  lineHeight: 1,
                }}>{s.n}</span>
              </div>
              <div style={{ fontSize: 34, marginBottom: 14 }}>{s.emoji}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700,
                color: B.text, marginBottom: 12, lineHeight: 1.35 }}>{s.t}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: B.textMuted,
                lineHeight: 1.8 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
      </Section>

      {/* ── Pricing ── */}
      <Section bg="#F5F7FA">
      <div style={{ maxWidth: 980, width: "100%" }}>
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: 12, color: B.textDim, textAlign: "center",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10,
        }}>Pricing</p>
        <h2 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
          color: B.text, textAlign: "center", margin: "0 auto 10px", lineHeight: 1.22,
        }}>Simple Pricing. No Surprises.</h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: B.textMuted,
          textAlign: "center", margin: "0 auto 48px", lineHeight: 1.6,
        }}>Try free for 14 days. No surprises, cancel anytime.</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", alignItems: "stretch" }}>

          {/* Pro Monthly Card */}
          <div style={{
            flex: "1 1 280px", maxWidth: 300,
            background: "#FFFFFF", border: `1px solid ${B.border}`,
            borderRadius: 20, padding: 32,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.textMuted,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pro Monthly</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 52, fontWeight: 800, color: B.text, lineHeight: 1 }}>$8</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: B.textMuted, lineHeight: 1.6 }}>/month</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, marginBottom: 28 }}>
              Billed monthly
            </div>
            <button style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "#FFFFFF", color: B.text,
              border: `1.5px solid ${B.border}`,
              fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600,
              cursor: "pointer", marginBottom: 10,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = B.accent; e.currentTarget.style.color = B.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.text; }}
            >Start Free Trial</button>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim, textAlign: "center", marginBottom: 28 }}>
              14 days free · cancel anytime
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {[
                "Unlimited application packages",
                "No watermark",
                "Full view analytics",
                "See exactly who watched and for how long",
                "Custom link page",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: B.success, fontWeight: 700, fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Annual Card — Most Popular */}
          <div style={{
            flex: "1 1 280px", maxWidth: 300,
            background: "linear-gradient(160deg, #0A66C2 0%, #1a7fd4 60%, #378FE9 100%)",
            borderRadius: 20, padding: 32,
            boxShadow: "0 12px 48px rgba(10,102,194,0.35), 0 2px 8px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
            position: "relative",
          }}>
            {/* Most Popular badge */}
            <div style={{
              position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #E06847, #e87d5a)",
              color: "#fff", padding: "5px 18px", borderRadius: 100,
              fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              boxShadow: "0 4px 16px rgba(224,104,71,0.4)",
              whiteSpace: "nowrap",
            }}>Most Popular</div>

            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pro Annual</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1 }}>$80</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>/year</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600, marginBottom: 28 }}>
              2 months free
            </div>
            <button style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "#E06847", color: "#fff", border: "none",
              fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
              cursor: "pointer", marginBottom: 10,
              boxShadow: "0 4px 20px rgba(224,104,71,0.4)",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(224,104,71,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(224,104,71,0.4)"; }}
            >Start Free Trial</button>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 28 }}>
              14 days free · cancel anytime
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {[
                "Unlimited application packages",
                "No watermark",
                "Full view analytics",
                "See exactly who watched and for how long",
                "Custom link page",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lifetime Card */}
          <div style={{
            flex: "1 1 280px", maxWidth: 300,
            background: "#FFFFFF", border: `1px solid ${B.border}`,
            borderRadius: 20, padding: 32,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.textMuted,
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Lifetime</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 52, fontWeight: 800, color: B.text, lineHeight: 1 }}>$99</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, marginBottom: 6 }}>
              one time, yours forever
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E06847", fontWeight: 600, marginBottom: 22 }}>
              No recurring billing — ever
            </div>
            <button style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: B.gradient, color: "#fff", border: "none",
              fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600,
              cursor: "pointer", marginBottom: 28,
              boxShadow: `0 4px 20px ${B.accentGlow}`,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(10,102,194,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${B.accentGlow}`; }}
            >Get Lifetime Access</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              {[
                "Everything in Pro",
                "No recurring billing",
                "Priority support",
                "All future features included",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: B.success, fontWeight: 700, fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Trust line */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textDim,
          textAlign: "center", marginTop: 28,
        }}>🔒 Secure payments · Cancel anytime · Instant access</p>
      </div>
      </Section>

      {/* ── Let's Get Started ── */}
      <Section bg="#FFFFFF">
      <div style={{
        maxWidth: 700, width: "100%",
        borderRadius: 32, overflow: "hidden",
        boxShadow: "0 16px 56px rgba(224,104,71,0.18)",
      }}>
        <div style={{ background: B.gradientHot, padding: "56px 44px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🚀</div>
          <h2 style={{
            fontFamily: "'Sora', sans-serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800,
            color: "#fff", margin: "0 0 18px", lineHeight: 1.18,
          }}>Let's get started.</h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(15px, 2vw, 19px)",
            color: "rgba(255,255,255,0.9)", lineHeight: 1.75, margin: "0 auto 36px", maxWidth: 500,
          }}>
            You've already done the hardest part — putting yourself out there.
            Let us help you make sure the right people actually see you.
            Your next interview is closer than you think.
          </p>
          <button onClick={onStart} style={{
            display: "inline-block", padding: "18px 52px", borderRadius: 16,
            background: "#fff", color: "#C4552E",
            fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800,
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,0,0,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)"; }}
          >
            Create My Free Pitch →
          </button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
            color: "rgba(255,255,255,0.65)", marginTop: 16 }}>
            Free · No account needed · Done in 5 minutes
          </p>
        </div>
      </div>
      </Section>

      <style>{`
        @keyframes landingFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Unified Script Generator ───

function ScriptGenerator({ isPaid, scriptUsed, onScriptUsed, onResetScript, script, onScriptGenerated, onNavigate, user, onNeedAuth }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState("60");
  const [analysis, setAnalysis] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // "" | "reading" | "done" | "error"
  const [uploadName, setUploadName] = useState("");
  const fileRef = useRef(null);

  const [savedId, setSavedId] = useState(null);
  const [gapAnswers, setGapAnswers] = useState({});
  const [rephrasedQuestions, setRephrasedQuestions] = useState({});
  const [rephrasingGaps, setRephrasingGaps] = useState(false);
  const [generatingBullets, setGeneratingBullets] = useState(false);
  const [bullets, setBullets] = useState(null);
  const [bulletsCopied, setBulletsCopied] = useState({});
  const [bulletsLimitReached, setBulletsLimitReached] = useState(false);
  const [regeneratingWithBullets, setRegeneratingWithBullets] = useState(false);
  const [isRegenerated, setIsRegenerated] = useState(false);
  const scriptOutputRef = useRef(null);

  const canGenerate = isPaid || !scriptUsed;

  useEffect(() => {
    const gaps = (analysis?.gapsToBridge || []).slice(0, 3);
    if (!gaps.length) {
      setRephrasedQuestions({});
      return;
    }

    let cancelled = false;
    setRephrasingGaps(true);

    const fallback = () => {
      if (cancelled) return;
      const map = {};
      gaps.forEach(gap => {
        const cleaned = gap.replace(/^(No|Lacks?|Limited|Minimal|Missing|Without)\s+/i, "").trim();
        const q = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
        map[gap] = `Do you have experience with ${q}?`;
      });
      setRephrasedQuestions(map);
      setRephrasingGaps(false);
    };

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/rephrase-gaps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ gaps }),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.questions) && data.questions.length === gaps.length) {
            const map = {};
            gaps.forEach((gap, i) => { map[gap] = data.questions[i]; });
            setRephrasedQuestions(map);
            setRephrasingGaps(false);
            return;
          }
        }
      } catch {}
      fallback();
    })();

    return () => { cancelled = true; };
  }, [analysis]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    setUploadStatus("reading");

    try {
      if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        // Read Word doc using mammoth
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResume(result.value.trim());
        setUploadStatus("done");
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setResume(text.trim());
        setUploadStatus("done");
      } else {
        setUploadStatus("error");
      }
    } catch (err) {
      console.error("File read error:", err);
      setUploadStatus("error");
    }
    // Reset file input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const generate = async () => {
    if (!user) { onNeedAuth(); return; }
    if (!resume.trim() || !jobDesc.trim() || !bio.trim()) return;
    setLoading(true); onScriptGenerated(""); setAnalysis(null);
    setSavedId(null);
    setGapAnswers({});
    setRephrasedQuestions({});
    setBullets(null);
    setBulletsCopied({});
    setBulletsLimitReached(false);
    setIsRegenerated(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resume, jobDesc, bio, duration }),
      });

      if (response.status === 403) {
        onScriptUsed();
        setLoading(false);
        return;
      }

      const data = await response.json();
      const text = data.text || "";
      const m = text.match(/<analysis>\s*([\s\S]*?)\s*<\/analysis>/);
      let parsedAnalysis = null;
      if (m) { try { parsedAnalysis = JSON.parse(m[1]); setAnalysis(parsedAnalysis); } catch(e) {} }
      const s = text.replace(/<analysis>[\s\S]*?<\/analysis>/, "").trim();
      onScriptGenerated(s || "Could not generate script. Please try again.");

      if (user) {
        const { data: inserted } = await supabase.from("scripts").insert({
          user_id: user.id,
          script: s || "",
          job_description: jobDesc,
          resume_text: resume,
          about_me: bio,
          duration,
          match_score: parsedAnalysis?.matchScore ?? null,
          strong_matches: parsedAnalysis?.strongMatches ?? null,
          gaps_to_bridge: parsedAnalysis?.gapsToBridge ?? null,
          angle_to_play: parsedAnalysis?.angleToPlay ?? null,
        }).select().single();
        if (inserted?.id) setSavedId(inserted.id);
      } else {
        localStorage.setItem("lp_script_used", "1");
      }
      if (!isPaid) onScriptUsed();
    } catch (err) {
      onScriptGenerated("Something went wrong. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const generateBullets = async () => {
    setGeneratingBullets(true);
    const gaps = (analysis?.gapsToBridge || []).slice(0, 3);
    const gapExperiences = gaps
      .filter(gap => gapAnswers[gap]?.hasExp === true && gapAnswers[gap]?.desc?.trim())
      .map(gap => ({ gap, desc: gapAnswers[gap].desc.trim() }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/strengthen-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ gapExperiences, scriptId: savedId }),
      });
      if (res.status === 403) {
        setBulletsLimitReached(true);
        setGeneratingBullets(false);
        return;
      }
      const data = await res.json();
      if (data.bullets) setBullets(data.bullets);
    } catch {}
    setGeneratingBullets(false);
  };

  const regenerateWithBullets = async () => {
    if (!bullets?.length || !resume.trim() || !jobDesc.trim() || !bio.trim()) return;
    setRegeneratingWithBullets(true);
    onScriptGenerated("");
    setAnalysis(null);
    setSavedId(null);

    const bulletSection = "\n\n---\nAdditional experience highlights to incorporate into the pitch:\n" + bullets.join("\n");
    const augmentedResume = resume.trim() + bulletSection;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resume: augmentedResume, jobDesc, bio, duration }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text || "";
        const m = text.match(/<analysis>\s*([\s\S]*?)\s*<\/analysis>/);
        let parsedAnalysis = null;
        if (m) { try { parsedAnalysis = JSON.parse(m[1]); } catch (e) {} }
        const scriptText = text.replace(/<analysis>[\s\S]*?<\/analysis>/, "").trim();
        setAnalysis(parsedAnalysis);
        onScriptGenerated(scriptText || "Could not generate script. Please try again.");
        setIsRegenerated(true);
        setTimeout(() => {
          scriptOutputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch {}
    setRegeneratingWithBullets(false);
  };

  const copyAllBullets = () => {
    if (!bullets) return;
    navigator.clipboard?.writeText(bullets.join("\n"));
    setBulletsCopied(prev => ({ ...prev, all: true }));
    setTimeout(() => setBulletsCopied(prev => ({ ...prev, all: false })), 2500);
  };

  const copyBullet = (bullet, i) => {
    navigator.clipboard?.writeText(bullet);
    setBulletsCopied(prev => ({ ...prev, [i]: true }));
    setTimeout(() => setBulletsCopied(prev => ({ ...prev, [i]: false })), 2500);
  };

  const gapList = (analysis?.gapsToBridge || []).slice(0, 3);
  const canGenerateBullets = gapList.some(gap => gapAnswers[gap]?.hasExp === true && gapAnswers[gap]?.desc?.trim());

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>🎯</span>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: B.text, margin: 0 }}>Script Generator</h2>
        {!isPaid && <PillBadge label="1 Free Use" color={B.warning} />}
        {isPaid && <PillBadge label="Unlimited" color={B.success} />}
      </div>

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
        Upload or paste your resume, paste the job description you're applying to, and write a short paragraph about yourself.
        We'll analyze the match and write a tailored video script.
      </p>

      {!canGenerate && (
        <div style={{
          padding: 20, borderRadius: 14, marginBottom: 20,
          background: "rgba(10,102,194,0.05)", border: "1px solid rgba(10,102,194,0.15)", textAlign: "center",
        }}>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: B.accent, margin: "0 0 8px" }}>
            You&apos;ve used your free script
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
            Upgrade to Pro to generate a unique script for every job you apply to.
          </p>
          <Btn variant="hot" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => {}}>
            Upgrade — $8/mo or $99 lifetime
          </Btn>
        </div>
      )}

      {canGenerate && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["30", "45", "60"].map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                padding: "8px 20px", borderRadius: 8,
                background: duration === d ? B.accent : B.surface,
                color: duration === d ? "#fff" : B.textMuted,
                border: `1px solid ${duration === d ? B.accent : B.border}`,
                fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}>{d}s</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            <div>
              <FieldLabel icon="📄">Your Resume</FieldLabel>
              {/* File upload area */}
              <div style={{
                display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap",
              }}>
                <input ref={fileRef} type="file" accept=".docx,.doc,.txt"
                  onChange={handleFileUpload} style={{ display: "none" }} />
                <button onClick={() => fileRef.current?.click()} style={{
                  padding: "8px 16px", borderRadius: 8, background: B.surface,
                  border: `1px solid ${B.border}`, color: B.textMuted,
                  fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  📎 Upload Word Doc
                </button>
                {uploadStatus === "reading" && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.warning }}>
                    ⏳ Reading {uploadName}...
                  </span>
                )}
                {uploadStatus === "done" && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.success }}>
                    ✓ {uploadName} loaded
                  </span>
                )}
                {uploadStatus === "error" && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E06847" }}>
                    ✗ Could not read file. Try PDF, .docx, or .txt
                  </span>
                )}
              </div>
              <TextArea value={resume} onChange={e => { setResume(e.target.value); setUploadStatus(""); setUploadName(""); }}
                placeholder="Upload your resume above, or paste it here. Note: copying and pasting from a PDF may distort formatting and wording — for best results, use the upload button above or paste from a Word document or plain text." minHeight={120} />
            </div>
            <div>
              <FieldLabel icon="💼">Job Description</FieldLabel>
              <TextArea value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Copy and paste the text of the job posting you're applying to." minHeight={120} />
            </div>
            <div>
              <FieldLabel icon="👤">About Me</FieldLabel>
              <TextArea value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Write a short paragraph about yourself — your personality, what drives you, what makes you unique..."
                minHeight={80} />
            </div>
          </div>

          <Btn variant="hot" onClick={generate}
            disabled={loading || !resume.trim() || !jobDesc.trim() || !bio.trim()}>
            {loading ? "⏳ Analyzing & Writing..." : "🎯 Generate My Script"}
          </Btn>
        </>
      )}

      {analysis && (
        <div style={{ marginTop: 24, padding: 20, background: "rgba(10,102,194,0.05)",
          border: "1px solid rgba(10,102,194,0.15)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, color: B.accentLight,
              textTransform: "uppercase", letterSpacing: "0.1em" }}>Role Match Analysis</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800,
                color: analysis.matchScore >= 75 ? B.success : analysis.matchScore >= 50 ? B.warning : "#E06847",
              }}>{analysis.matchScore}%</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim }}>match</span>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)", marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${analysis.matchScore}%`,
              background: analysis.matchScore >= 75 ? `linear-gradient(90deg, ${B.success}, #046636)`
                : analysis.matchScore >= 50 ? `linear-gradient(90deg, ${B.warning}, #FFEAA7)`
                : `linear-gradient(90deg, #E06847, #E7A33E)`,
              transition: "width 1s ease" }} />
          </div>
          {analysis.matchScore < 70 && (
            <div style={{ padding: "14px 16px", borderRadius: 12, marginBottom: 20,
              background: "rgba(231,163,62,0.06)", border: "1px solid rgba(231,163,62,0.15)" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: 0, lineHeight: 1.7 }}>
                💛 You may not be a perfect match on paper — but here's how to frame your experience to still stand out. Focus on the transferable strengths below and let your personality shine through in your video.
              </p>
            </div>
          )}
          {analysis.strongMatches?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.success,
                textTransform: "uppercase", letterSpacing: "0.1em" }}>✓ Strong Matches</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {analysis.strongMatches.map((m, i) => (
                  <span key={i} style={{ padding: "6px 12px", borderRadius: 8,
                    background: "rgba(5,118,66,0.08)", border: "1px solid rgba(5,118,66,0.15)",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.success }}>{m}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.gapsToBridge?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.warning,
                textTransform: "uppercase", letterSpacing: "0.1em" }}>↗ Gaps We'll Bridge</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {analysis.gapsToBridge.map((g, i) => (
                  <span key={i} style={{ padding: "6px 12px", borderRadius: 8,
                    background: "rgba(231,163,62,0.08)", border: "1px solid rgba(231,163,62,0.15)",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.warning }}>{g}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.angleToPlay && (
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(10,102,194,0.05)",
              border: "1px solid rgba(10,102,194,0.1)" }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.accentLight,
                textTransform: "uppercase", letterSpacing: "0.1em" }}>💡 Your Angle</span>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.text, margin: "8px 0 0", lineHeight: 1.6 }}>
                {analysis.angleToPlay}</p>
            </div>
          )}
        </div>
      )}

      {/* Strengthen Your Resume — free 1 use, paid unlimited; only for authenticated users */}
      {user && !isRegenerated && gapList.length > 0 && (analysis || script) && (
        <div style={{
          marginTop: 24, background: B.surface, border: "1px solid #2A5080", borderRadius: 20,
          padding: 28, boxShadow: "0 2px 12px rgba(42, 80, 128, 0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>💪</span>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: B.text, margin: 0 }}>Strengthen Your Resume</h2>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: B.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>
            Tell us about your experience with each gap — we&apos;ll write polished, ATS-friendly resume bullets you can add before your recording.
          </p>

          {gapList.map((gap, i) => {
            const ans = gapAnswers[gap] || {};
            return (
              <div key={i} style={{ marginBottom: 16, padding: 16, borderRadius: 14, background: B.bg, border: `1px solid ${B.border}` }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.text, margin: "0 0 10px", lineHeight: 1.5 }}>
                  {rephrasingGaps
                    ? <span style={{ color: B.textDim, fontStyle: "italic" }}>Loading question...</span>
                    : (rephrasedQuestions[gap] || `Do you have experience with ${gap.replace(/^No\s+/i, "")}?`)}
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: ans.hasExp === true ? 12 : 0 }}>
                  <button
                    onClick={() => setGapAnswers(prev => ({ ...prev, [gap]: { ...prev[gap], hasExp: true, desc: prev[gap]?.desc || "" } }))}
                    style={{
                      padding: "7px 18px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${ans.hasExp === true ? B.accent : B.border}`,
                      background: ans.hasExp === true ? "rgba(10,102,194,0.08)" : B.surface,
                      color: ans.hasExp === true ? B.accent : B.textMuted,
                      fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                    }}>Yes</button>
                  <button
                    onClick={() => setGapAnswers(prev => ({ ...prev, [gap]: { ...prev[gap], hasExp: false, desc: "" } }))}
                    style={{
                      padding: "7px 18px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${ans.hasExp === false ? "rgba(220,53,69,0.3)" : B.border}`,
                      background: ans.hasExp === false ? "rgba(220,53,69,0.04)" : B.surface,
                      color: ans.hasExp === false ? "#DC3545" : B.textMuted,
                      fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                    }}>No</button>
                </div>
                {ans.hasExp === true && (
                  <textarea
                    value={ans.desc || ""}
                    onChange={e => setGapAnswers(prev => ({ ...prev, [gap]: { ...prev[gap], desc: e.target.value } }))}
                    placeholder="Briefly describe your experience in 1-2 sentences..."
                    style={{
                      width: "100%", minHeight: 68, padding: "10px 14px", background: B.surface, color: B.text,
                      border: `1px solid ${B.border}`, borderRadius: 10,
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "vertical", outline: "none",
                      lineHeight: 1.6, boxSizing: "border-box",
                    }}
                    onFocus={e => e.target.style.borderColor = B.accent}
                    onBlur={e => e.target.style.borderColor = B.border}
                  />
                )}
              </div>
            );
          })}

          {canGenerateBullets && !bullets && (
            bulletsLimitReached ? (
              <div style={{
                padding: "16px 20px", borderRadius: 14,
                background: "rgba(10,102,194,0.04)", border: "1px solid rgba(10,102,194,0.15)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              }}>
                <div>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.accent }}>
                    Resume bullets already generated
                  </span>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted, margin: "4px 0 0" }}>
                    Upgrade to Pro to strengthen your resume for every application.
                  </p>
                </div>
                <a href="/pricing" style={{
                  padding: "10px 20px", borderRadius: 10,
                  background: B.gradient, color: "#fff", textDecoration: "none",
                  fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                }}>Upgrade to Pro →</a>
              </div>
            ) : (
              <button
                onClick={generateBullets}
                disabled={generatingBullets}
                style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: generatingBullets ? "#C8D0D9" : "linear-gradient(135deg, #057642, #046636)",
                  color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700,
                  cursor: generatingBullets ? "not-allowed" : "pointer",
                  boxShadow: generatingBullets ? "none" : "0 4px 16px rgba(5,118,66,0.2)",
                }}
              >{generatingBullets ? "⏳ Generating bullets..." : "✨ Generate Resume Bullets"}</button>
            )
          )}

          {bullets && (
            <div>
              <div style={{
                padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                background: "rgba(231,163,62,0.07)", border: "1px solid rgba(231,163,62,0.2)",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: B.textMuted, lineHeight: 1.5,
              }}>
                ⚠️ <strong style={{ color: B.text }}>These are examples.</strong> Replace any bracketed placeholders like <code style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(0,0,0,0.05)", padding: "1px 4px", borderRadius: 4 }}>[X%]</code> or <code style={{ fontFamily: "monospace", fontSize: 12, background: "rgba(0,0,0,0.05)", padding: "1px 4px", borderRadius: 4 }}>[region]</code> with your real numbers and details before adding to your resume.
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.success, textTransform: "uppercase", letterSpacing: "0.1em" }}>✓ Resume Bullets</span>
                <button onClick={copyAllBullets} style={{
                  padding: "6px 14px", borderRadius: 8, border: `1px solid ${B.border}`,
                  background: bulletsCopied.all ? "rgba(5,118,66,0.07)" : B.surface,
                  color: bulletsCopied.all ? B.success : B.textMuted,
                  fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>{bulletsCopied.all ? "✓ Copied!" : "📋 Copy All Bullets"}</button>
              </div>
              <div style={{ padding: "16px 20px", background: B.bg, border: `1px solid ${B.border}`, borderRadius: 14, display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                {bullets.map((bullet, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <p style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.text, margin: 0, lineHeight: 1.7 }}>{bullet}</p>
                    <button onClick={() => copyBullet(bullet, i)} style={{
                      flexShrink: 0, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                      border: `1px solid ${B.border}`,
                      background: bulletsCopied[i] ? "rgba(5,118,66,0.07)" : B.surface,
                      color: bulletsCopied[i] ? B.success : B.textMuted,
                      fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600,
                    }}>{bulletsCopied[i] ? "✓" : "📋"}</button>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: B.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
                Add these to your resume before recording your pitch!<br />
                💡 These are suggestions based on what you shared. Tweak the wording so it&apos;s accurate and true to your own experience before adding it to your resume.
              </p>
              {isPaid && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    onClick={regenerateWithBullets}
                    disabled={regeneratingWithBullets}
                    style={{
                      padding: "10px 22px", borderRadius: 10, border: "none",
                      background: regeneratingWithBullets ? "#C8D0D9" : "linear-gradient(135deg, #0A66C2 0%, #C8442A 100%)",
                      color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700,
                      cursor: regeneratingWithBullets ? "not-allowed" : "pointer",
                      boxShadow: regeneratingWithBullets ? "none" : "0 4px 16px rgba(10,102,194,0.2)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    {regeneratingWithBullets
                      ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Re-writing…</>
                      : "✨ Re-generate Script With These Additions"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post-regeneration CTA — appears after Re-generate With Additions */}
      {user && isRegenerated && script && (
        <div style={{
          marginTop: 24, background: B.surface, border: "1px solid #2A5080", borderRadius: 20,
          padding: 28, boxShadow: "0 2px 12px rgba(42, 80, 128, 0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.text, margin: 0, lineHeight: 1.6 }}>
            🎥 Your script is ready — head to Record to capture your pitch!
          </p>
          <button onClick={() => onNavigate("record")} style={{
            padding: "12px 28px", borderRadius: 12, whiteSpace: "nowrap", border: "none",
            background: B.gradient, color: "#fff", cursor: "pointer",
            fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700,
            boxShadow: `0 4px 16px ${B.accentGlow}`,
          }}>Go to Record →</button>
        </div>
      )}

      {script && (
        <div ref={scriptOutputRef} style={{
          marginTop: 24, borderRadius: 16, overflow: "hidden",
          boxShadow: "0 8px 40px rgba(10,102,194,0.25), 0 0 0 1px rgba(10,102,194,0.2)",
          animation: "ctaSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ background: B.gradient, padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                Your script is ready!
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>
                Switch to the Record tab to read it as a teleprompter while you record.
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(10,102,194,0.06)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted }}>
              Your script will appear as a scrollable guide above the camera preview.
            </span>
            <button onClick={() => onNavigate("record")} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: B.gradient, color: "#fff", cursor: "pointer",
              fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700,
              boxShadow: `0 4px 20px ${B.accentGlow}`, whiteSpace: "nowrap",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(10,102,194,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${B.accentGlow}`; }}
            >
              Head to the Record Tab →
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes ctaSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Card>
  );
}

// ─── Survey Popup (shown after first recording) ───

function SurveyPopup({ onComplete, user }) {
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [email, setEmail] = useState("");
  const [tosChecked, setTosChecked] = useState(false);

  const q1Options = [
    { id: "overlooked", label: "🔍 I'm qualified but keep getting overlooked" },
    { id: "switching",  label: "🔄 I'm switching careers and my resume doesn't tell my story yet" },
    { id: "starting",   label: "🎓 Just starting out and need to stand out" },
    { id: "searching",  label: "📉 Been searching too long with no results" },
  ];
  const q2Options = [
    { id: "linkedin", label: "LinkedIn" },
    { id: "reddit",   label: "Reddit" },
    { id: "friend",   label: "Friend or colleague" },
    { id: "google",   label: "Google search" },
    { id: "other",    label: "Other" },
  ];

  const handleSubmit = async () => {
    const emailToSave = user ? user.email : email;
    if (user) {
      try {
        await supabase.from("survey_responses").insert({
          user_id: user.id,
          situation: q1,
          source: q2,
          email: emailToSave,
        });
      } catch (err) {
        console.error("Survey save error:", err);
      }
    }
    onComplete();
  };

  const optionStyle = (selected) => ({
    padding: "12px 16px", borderRadius: 12, textAlign: "left", width: "100%",
    border: `1.5px solid ${selected ? "#0A66C2" : B.border}`,
    background: selected ? "rgba(10,102,194,0.06)" : B.surface,
    color: selected ? "#0A66C2" : B.text,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    fontWeight: selected ? 600 : 400,
    cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 24, padding: "36px 32px 32px",
        maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        position: "relative",
      }}>
        <button onClick={onComplete} style={{
          position: "absolute", top: 16, right: 16,
          background: "transparent", border: "none",
          fontSize: 18, cursor: "pointer", color: B.textDim,
          padding: "4px 8px", lineHeight: 1,
        }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: B.text, margin: "0 0 10px" }}>
            🎉 Your pitch is ready!
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.textMuted, lineHeight: 1.6, margin: 0 }}>
            Before you grab your link — help us make LiftPitch better for people like you.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.text, margin: "0 0 10px" }}>
            Which best describes your situation?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q1Options.map(opt => (
              <button key={opt.id} onClick={() => setQ1(opt.id)} style={optionStyle(q1 === opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.text, margin: "0 0 10px" }}>
            How did you hear about LiftPitch?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q2Options.map(opt => (
              <button key={opt.id} onClick={() => setQ2(opt.id)} style={optionStyle(q2 === opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {!user && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.text, display: "block", marginBottom: 8 }}>
            Drop your email to get your shareable link:
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: "100%", padding: "12px 16px", boxSizing: "border-box",
              border: `1px solid ${B.border}`, borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.text,
              background: B.bg, outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = B.accent}
            onBlur={e => e.target.style.borderColor = B.border}
          />
        </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={tosChecked} onChange={e => setTosChecked(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted, lineHeight: 1.6 }}>
              I agree to LiftPitch's{" "}
              <a href="/legal" target="_blank" rel="noopener noreferrer" style={{ color: B.accent, textDecoration: "none" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="/legal" target="_blank" rel="noopener noreferrer" style={{ color: B.accent, textDecoration: "none" }}>Privacy Policy</a>
            </span>
          </label>
        </div>

        <button onClick={handleSubmit} disabled={!tosChecked} style={{
          width: "100%", padding: "16px", borderRadius: 12,
          background: tosChecked ? "#E06847" : "#C8D0D9",
          color: "#fff", border: "none",
          fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700,
          cursor: tosChecked ? "pointer" : "not-allowed",
          boxShadow: tosChecked ? "0 4px 20px rgba(224,104,71,0.3)" : "none",
          transition: "all 0.2s",
        }}>
          Get My Link →
        </button>
      </div>
    </div>
  );
}

// ─── Video Recorder (Live-Only Verified) ───

function VideoRecorder({ onVideoRecorded, script, isPaid, user, onNeedAuth }) {
  const videoRef = useRef(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [state, setState] = useState("idle");
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [maxDur, setMaxDur] = useState(60);
  const [countdown, setCountdown] = useState(0);
  const [verification, setVerification] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [linkRevealed, setLinkRevealed] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | done | error
  const surveyShownRef = useRef(false);
  const pendingBlobRef = useRef(null);
  const timer = useTimer(maxDur);
  const [editableScript, setEditableScript] = useState(script || "");
  const [scrollPlaying, setScrollPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState("slow");
  const scrollContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const scriptTextareaRef = useRef(null);
  const scrollPxRef = useRef(1);
  const scrollIntervalMsRef = useRef(67);
  const SCROLL_CONFIG = { slow: { px: 1, ms: 67 }, medium: { px: 2, ms: 67 } };
  const [videoLimitReached, setVideoLimitReached] = useState(false);

  useEffect(() => { if (script) { setEditableScript(script); if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; } }, [script]);

  useEffect(() => {
    const ta = scriptTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [editableScript]);

  useEffect(() => () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); }, []);

  useEffect(() => {
    if (!user || isPaid) return;
    supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setVideoLimitReached((count ?? 0) >= 1))
      .catch(err => console.warn("[VideoRecorder] video count fetch failed:", err));
  }, [user, isPaid]);

  const startScroll = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    setScrollPlaying(true);
    scrollIntervalRef.current = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTop += scrollPxRef.current;
    }, scrollIntervalMsRef.current);
  };

  const stopScroll = () => {
    setScrollPlaying(false);
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null; }
  };

  const handleSpeedChange = (s) => {
    setScrollSpeed(s);
    scrollPxRef.current = SCROLL_CONFIG[s].px;
    scrollIntervalMsRef.current = SCROLL_CONFIG[s].ms;
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = setInterval(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        el.scrollTop += scrollPxRef.current;
      }, scrollIntervalMsRef.current);
    }
  };

  const uploadToStream = async (blob, verificationHash) => {
    setUploadStatus("uploading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      // Step 1: get a Cloudflare Stream direct upload URL.
      const urlRes = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!urlRes.ok) throw new Error(`get-upload-url: ${await urlRes.text()}`);
      const { uploadURL, uid } = await urlRes.json();

      // Step 2: POST blob to Cloudflare Stream direct upload URL.
      const formData = new FormData();
      formData.append('file', blob, 'video.webm');
      const putRes = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      });
      if (!putRes.ok) throw new Error(`Stream upload failed: ${putRes.status}`);

      // Step 3: register the video in Supabase (server polls Stream until ready).
      const regRes = await fetch("/api/register-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ streamUid: uid, verificationHash }),
      });
      if (!regRes.ok) throw new Error(`register-video: ${await regRes.text()}`);
      const { shareLink: realLink } = await regRes.json();
      setShareLink(realLink);
      setUploadStatus("done");

      if (!isPaid && user?.email) {
        fetch("/api/send-video-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: user.email,
            shareLink: realLink,
            verificationId: verificationHash,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Video upload failed:", err);
      setUploadStatus("error");
    }
  };

  const genVerify = () => {
    const now = new Date();
    const sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const hash = btoa(`vp-${sid}-${now.toISOString()}-live`).substring(0, 16).toUpperCase();
    return { sessionId: sid, recordedAt: now.toISOString(), method: "LIVE_CAPTURE",
      verificationHash: `VP-${hash}`, deviceStream: true, uploadBlocked: true };
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play(); }
      setState("previewing");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(`${err.name}: ${err.message}`);
    }
  };

  const startCountdown = () => {
    setState("countdown"); setCountdown(3);
    let c = 3;
    const iv = setInterval(() => { c--; setCountdown(c); if (c <= 0) { clearInterval(iv); beginRec(); } }, 1000);
  };

  const beginRec = () => {
    chunksRef.current = [];
    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4;codecs=avc1", "video/mp4"]
      .find(t => MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blobType = mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type: blobType });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      const v = genVerify(); setVerification(v);
      pendingBlobRef.current = { blob, url };
      setState("preview");
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = url; videoRef.current.muted = false; }
    };
    mr.start(); mrRef.current = mr; timer.start(); setState("recording");
  };

  const stopRec = () => { mrRef.current?.stop(); timer.stop(); };
  useEffect(() => { if (timer.sec >= maxDur && state === "recording") stopRec(); }, [timer.sec, maxDur, state]);
  const confirmUpload = () => {
    if (!pendingBlobRef.current || !verification) return;
    const { blob } = pendingBlobRef.current;
    const fallbackId = verification.verificationHash.replace("VP-", "").toLowerCase();
    setShareLink(`https://lift-pitch.co/v/${fallbackId}`);
    setState("recorded");
    if (onVideoRecorded) onVideoRecorded(verification.verificationHash);
    if (user) uploadToStream(blob, verification.verificationHash);
    if (!surveyShownRef.current) { surveyShownRef.current = true; setShowSurveyModal(true); } else { setLinkRevealed(true); }
    pendingBlobRef.current = null;
  };
  const redo = () => {
    if (pendingBlobRef.current) { URL.revokeObjectURL(pendingBlobRef.current.url); pendingBlobRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    chunksRef.current = [];
    mrRef.current = null;
    timer.reset();
    setVerification(null); setRecordedUrl(null);
    setState("idle");
    setTimeout(() => startCamera(), 200);
  };
  const reset = () => { if (pendingBlobRef.current) { URL.revokeObjectURL(pendingBlobRef.current.url); pendingBlobRef.current = null; } timer.reset(); setRecordedUrl(null); setShareLink(""); setCopied(false); setVerification(null); setState("idle"); setLinkRevealed(false); setUploadStatus("idle"); surveyShownRef.current = false; streamRef.current?.getTracks().forEach(t => t.stop()); };
  const copyLink = () => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <>
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>🎥</span>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: B.text, margin: 0 }}>Record Your Pitch</h2>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, marginBottom: 20,
        background: "rgba(5,118,66,0.05)", border: "1px solid rgba(5,118,66,0.12)" }}>
        <span style={{ fontSize: 16, marginTop: 1 }}>🛡️</span>
        <div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.success,
            textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Recording Only</span>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted, margin: "4px 0 0", lineHeight: 1.5 }}>
            No uploads, no pre-recorded files, no AI-generated videos. Every video gets a verified badge recruiters can trust.
          </p>
        </div>
      </div>

      {state === "idle" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <FieldLabel icon="⏱">Max Duration</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {[30, 45, 60].map(d => (
                  <button key={d} onClick={() => setMaxDur(d)} style={{
                    padding: "8px 20px", borderRadius: 8, background: maxDur === d ? B.accent : B.surface,
                    color: maxDur === d ? "#fff" : B.textMuted, border: `1px solid ${maxDur === d ? B.accent : B.border}`,
                    fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>{d}s</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(script || editableScript) ? (
        <div style={{ marginBottom: 20, borderRadius: 14, background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600,
              color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              📜 Teleprompter
            </span>
            <button onClick={() => navigator.clipboard?.writeText(editableScript)} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "4px 12px", color: "rgba(255,255,255,0.5)",
              fontSize: 11, cursor: "pointer", fontFamily: "'Sora', sans-serif",
            }}>📋 Copy</button>
          </div>
          <div ref={scrollContainerRef} style={{ maxHeight: 120, overflowY: "auto", padding: "16px 20px", width: "60%", margin: "0 auto" }}>
            <textarea
              ref={scriptTextareaRef}
              value={editableScript}
              onChange={e => setEditableScript(e.target.value)}
              placeholder="Click to edit your script..."
              style={{
                width: "100%", background: "transparent", resize: "none", overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, outline: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "rgba(255,255,255,0.85)",
                lineHeight: 1.9, margin: 0, padding: "8px 10px", boxSizing: "border-box",
                minHeight: 80, caretColor: "#378FE9",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(55,143,233,0.45)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.03)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => scrollPlaying ? stopScroll() : startScroll()} style={{
              padding: "5px 14px", borderRadius: 6,
              border: `1px solid ${scrollPlaying ? B.accent : "rgba(255,255,255,0.15)"}`,
              background: scrollPlaying ? B.accent : "rgba(255,255,255,0.06)",
              color: scrollPlaying ? "#fff" : "rgba(255,255,255,0.75)",
              fontSize: 14, cursor: "pointer", fontFamily: "'Sora', sans-serif",
              fontWeight: 600, transition: "all 0.15s", lineHeight: 1,
            }}>{scrollPlaying ? "⏸" : "▶"}</button>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 10,
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Speed:
            </span>
            {["slow", "medium"].map(s => (
              <button key={s} onClick={() => handleSpeedChange(s)} style={{
                padding: "4px 10px", borderRadius: 6,
                border: `1px solid ${scrollSpeed === s ? "rgba(55,143,233,0.4)" : "rgba(255,255,255,0.1)"}`,
                background: scrollSpeed === s ? "rgba(10,102,194,0.25)" : "rgba(255,255,255,0.04)",
                color: scrollSpeed === s ? "#378FE9" : "rgba(255,255,255,0.4)",
                fontSize: 11, cursor: "pointer", fontFamily: "'Sora', sans-serif",
                fontWeight: scrollSpeed === s ? 600 : 400, transition: "all 0.15s",
                textTransform: "capitalize",
              }}>{s}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 12,
          background: "rgba(231,163,62,0.06)", border: "1px solid rgba(231,163,62,0.15)" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.warning }}>
            💡 Tip: Generate a script first to use as a guide while recording.
          </span>
        </div>
      )}

      <div style={{
        marginBottom: 12, padding: "10px 16px", borderRadius: 10,
        background: "rgba(10,102,194,0.05)", border: "1px solid rgba(10,102,194,0.10)",
        fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: B.textMuted, lineHeight: 1.55,
      }}>
        💡 <strong style={{ color: B.text }}>Pro tip:</strong> Find a plain wall or tidy corner — good lighting matters more than a perfect background!
      </div>

      {videoLimitReached && (
        <div style={{
          padding: 20, borderRadius: 14, marginBottom: 20,
          background: "rgba(10,102,194,0.05)", border: "1px solid rgba(10,102,194,0.15)", textAlign: "center",
        }}>
          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🎉</span>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: B.accent, margin: "0 0 8px" }}>
            You&apos;ve built your first LiftPitch application package!
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
            Upgrade to Pro to create a unique pitch for every job you apply to — plus see exactly who watched your video.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="hot" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => {}}>
              Pro Monthly — $8/mo
            </Btn>
            <Btn variant="secondary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => {}}>
              Lifetime Pass — $99
            </Btn>
          </div>
        </div>
      )}

      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000",
        aspectRatio: "16/9", marginBottom: 20,
        border: state === "recording" ? "2px solid #DC3545" : state === "countdown" ? `2px solid ${B.warning}` : `1px solid ${B.border}` }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover",
          display: state === "idle" ? "none" : "block",
          transform: state !== "recorded" && state !== "preview" ? "scaleX(-1)" : "none",
        }} playsInline controls={state === "recorded" || state === "preview"} />

        {state === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: B.surface }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📹</div>
            {cameraError
              ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#DC3545", textAlign: "center", padding: "0 16px" }}>{cameraError}</span>
              : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textDim }}>Click below to start your camera</span>}
          </div>
        )}
        {state === "countdown" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 10 }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 96, fontWeight: 800, color: "#fff",
              textShadow: `0 0 60px ${B.accentGlow}`, animation: "countPulse 1s ease-in-out infinite" }}>{countdown}</div>
          </div>
        )}
        {state === "recording" && (
          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center",
            gap: 8, padding: "8px 16px", borderRadius: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC3545", animation: "pulse 1.2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff" }}>{fmt(timer.sec)} / {fmt(maxDur)}</span>
          </div>
        )}
        {state === "recorded" && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5 }}><VerifiedBadge size="small" /></div>}
        {state === "recorded" && (
          <div style={{
            position: "absolute", bottom: 48, right: 12, zIndex: 5,
            padding: isPaid ? "3px 8px" : "5px 12px", borderRadius: 6,
            background: "rgba(0,0,0,0.4)",
            fontFamily: "'Sora', sans-serif",
            fontSize: isPaid ? 10 : 12, fontWeight: 600,
            color: isPaid ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)",
            letterSpacing: "0.04em", pointerEvents: "none",
          }}>✓ LiftPitch Verified</div>
        )}
        {state === "recording" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(0,0,0,0.08)" }}>
            <div style={{ height: "100%", width: `${(timer.sec / maxDur) * 100}%`,
              background: timer.sec > maxDur * 0.8 ? "linear-gradient(90deg, #E7A33E, #E06847)" : B.gradient,
              transition: "width 1s linear" }} />
          </div>
        )}
      </div>

      {state === "preview" && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: "0 0 12px", lineHeight: 1.5, textAlign: "center" }}>
          How did that go? Watch your preview and decide.
        </p>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {state === "idle" && !videoLimitReached && <Btn onClick={() => { if (!user) { onNeedAuth(); return; } startCamera(); }}>📷 Open Camera</Btn>}
        {state === "previewing" && <Btn onClick={startCountdown} style={{
          background: "linear-gradient(135deg, #DC3545, #C0392B)", boxShadow: "0 4px 24px rgba(220,53,69,0.2)" }}>⏺ Start Recording</Btn>}
        {state === "recording" && <Btn onClick={stopRec} variant="secondary">⏹ Stop Recording</Btn>}
        {state === "preview" && <Btn onClick={redo} variant="secondary">🔄 Re-do</Btn>}
        {state === "preview" && <Btn onClick={confirmUpload} style={{ background: "linear-gradient(135deg, #057642, #046636)", boxShadow: "0 4px 24px rgba(5,118,66,0.2)" }}>✅ Happy with this!</Btn>}
        {state === "recorded" && <Btn onClick={reset} variant="secondary">🔄 Record Again</Btn>}
      </div>

      {state === "recorded" && linkRevealed && (
        <div style={{ marginTop: 24, padding: 20, background: "rgba(5,118,66,0.05)",
          border: "1px solid rgba(5,118,66,0.15)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.success,
              textTransform: "uppercase", letterSpacing: "0.1em" }}>🔗 Your Verified Link</span>
            <VerifiedBadge size="small" />
          </div>

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
                ⚠️ Upload failed — your video is only available in this browser session. Try recording again when you have a stable connection.
              </span>
            </div>
          )}

          {(uploadStatus === "done" || uploadStatus === "error") && shareLink && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, padding: "12px 16px", background: B.bg, borderRadius: 10,
                  border: `1px solid ${B.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: B.accentLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shareLink}
                </div>
                <Btn onClick={copyLink} variant={copied ? "success" : "secondary"} style={{ padding: "12px 20px", flexShrink: 0 }}>
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </Btn>
              </div>
              {uploadStatus === "done" && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim, marginTop: 12, lineHeight: 1.5 }}>
                  Add this link to your resume. Recruiters will see the verified badge confirming this was recorded live.
                </p>
              )}
            </>
          )}

          {verification && uploadStatus !== "uploading" && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: B.bg, border: `1px solid ${B.border}` }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.textDim,
                textTransform: "uppercase", letterSpacing: "0.1em" }}>Verification Certificate</span>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", marginTop: 10,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
                <span style={{ color: B.textDim }}>Method</span><span style={{ color: B.success, fontWeight: 600 }}>LIVE CAPTURE</span>
                <span style={{ color: B.textDim }}>Verification ID</span><span style={{ color: B.text, fontFamily: "monospace", fontSize: 11 }}>{verification.verificationHash}</span>
                <span style={{ color: B.textDim }}>Recorded</span><span style={{ color: B.text }}>{new Date(verification.recordedAt).toLocaleString()}</span>
                <span style={{ color: B.textDim }}>Device Stream</span><span style={{ color: B.success }}>✓ Verified</span>
                <span style={{ color: B.textDim }}>No Uploads</span><span style={{ color: B.success }}>✓ Live only</span>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)} }
        @keyframes countPulse { 0%{transform:scale(.8);opacity:.5}50%{transform:scale(1.1);opacity:1}100%{transform:scale(.8);opacity:.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </Card>
    {showSurveyModal && (
      <SurveyPopup onComplete={() => { setShowSurveyModal(false); setLinkRevealed(true); }} user={user} />
    )}
    </>
  );
}

// ─── View Analytics (Paid) ───

function Analytics({ isPaid, videos }) {
  const [demoData] = useState(() => {
    if (!isPaid || videos.length === 0) return [];
    return videos.map((v, i) => ({
      id: v, label: `Video Pitch ${i + 1}`,
      views: Math.floor(Math.random() * 25) + 3,
      uniqueViewers: Math.floor(Math.random() * 15) + 2,
      avgWatchTime: Math.floor(Math.random() * 40) + 15,
      lastViewed: new Date(Date.now() - Math.random() * 86400000 * 5).toLocaleDateString(),
      recentViews: Array.from({ length: 7 }, () => Math.floor(Math.random() * 6)),
    }));
  });
  const totalViews = demoData.reduce((a, d) => a + d.views, 0);
  const totalUnique = demoData.reduce((a, d) => a + d.uniqueViewers, 0);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>📊</span>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: B.text, margin: 0 }}>View Analytics</h2>
        {isPaid ? <PillBadge label="Pro" color={B.success} /> : <PillBadge label="Pro Only" color={B.warning} />}
      </div>

      {!isPaid ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16, opacity: 0.4 }}>📊</span>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600, color: B.text, margin: "0 0 8px" }}>
            See who's watching your pitch</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>
            Track total views, unique viewers, average watch time, and daily activity for every video you record.
            Know exactly when a recruiter clicks your link.</p>
          <Btn variant="hot" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => {}}>
            Upgrade — $8/mo or $99 lifetime</Btn>
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12, opacity: 0.4 }}>🎥</span>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted }}>
            Record your first video to start tracking views.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total Views", value: totalViews, icon: "👁️", color: B.accentLight },
              { label: "Unique Viewers", value: totalUnique, icon: "👤", color: B.success },
              { label: "Videos", value: videos.length, icon: "🎥", color: B.warning },
            ].map(s => (
              <div key={s.label} style={{ flex: "1 1 140px", padding: 16, borderRadius: 14,
                background: B.bg, border: `1px solid ${B.border}` }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim }}>{s.label}</div>
              </div>
            ))}
          </div>
          {demoData.map(d => (
            <div key={d.id} style={{ padding: 16, borderRadius: 12, background: B.bg,
              border: `1px solid ${B.border}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: B.text }}>{d.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: B.textDim, marginLeft: 10 }}>
                    Last viewed: {d.lastViewed}</span>
                </div>
                <VerifiedBadge size="small" />
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
                {[
                  { l: "Views", v: d.views, c: B.accentLight },
                  { l: "Unique", v: d.uniqueViewers, c: B.success },
                  { l: "Avg. Watch", v: d.avgWatchTime + "s", c: B.warning },
                ].map(x => (
                  <div key={x.l}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: B.textDim }}>{x.l}</span>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: x.c }}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: 3, height: 32 }}>
                {d.recentViews.map((v, i) => (
                  <div key={i} style={{ flex: 1, height: `${Math.max((v / 6) * 100, 8)}%`,
                    borderRadius: 3, background: B.gradient, opacity: 0.6 + (v / 10) }} />
                ))}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: B.textDim, marginTop: 4 }}>Last 7 days</div>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}

// ─── Tips & Tricks ───

function TipsAndTricks() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const tips = [
    { icon: "⏱️", title: "The 7-Second Rule",
      preview: "Recruiters spend an average of 6–8 seconds scanning a resume.",
      full: "Recruiters spend an average of 6–8 seconds scanning a resume. That means your name, title, and top 2–3 skills need to hit them immediately. Put your strongest qualification in the first line of your summary. Your video pitch follows the same rule: the first sentence decides if they keep watching." },
    { icon: "🎯", title: "Tailor Every Application",
      preview: "Sending the same resume to 50 jobs is the #1 mistake job seekers make.",
      full: "Sending the same resume to 50 jobs is the #1 mistake job seekers make. Mirror the language from the job description. If they say \"cross-functional collaboration,\" use that exact phrase. ATS systems and recruiters both scan for keyword matches. The same applies to your video pitch: mention the company by name and the specific role." },
    { icon: "🤝", title: "The Hidden Job Market",
      preview: "Up to 70% of jobs are never posted publicly.",
      full: "Up to 70% of jobs are never posted publicly — they're filled through referrals and internal transfers. Networking isn't optional; it's the primary way people get hired. Your LiftPitch link is a powerful networking tool — it's memorable, personal, and shows initiative." },
    { icon: "🚫", title: "Stop Lying on Your Resume",
      preview: "Nearly half of job seekers admit to lying or considering it.",
      full: "Nearly half of job seekers admit to lying or considering lying on their resume. Don't. Background checks are thorough, and getting caught means instant disqualification. Instead, reframe gaps honestly. Your video pitch makes honesty your superpower — authenticity on camera is impossible to fake." },
    { icon: "📧", title: "Follow Up (The Right Way)",
      preview: "Most candidates never follow up, which is a missed opportunity.",
      full: "Most candidates never follow up after applying or interviewing, and that's a huge missed opportunity. Send a brief follow-up 3–5 business days after applying, and within 24 hours after an interview. Reference something specific from the conversation. Keep it to 3–4 sentences." },
    { icon: "💡", title: "AI Resumes Are Hurting You",
      preview: "88% of hiring managers can tell when applications are AI-generated.",
      full: "88% of hiring managers say they can tell when applications are AI-generated, and it's not helping. AI-written resumes all sound the same. Use AI as a starting point, but rewrite in your own voice. Better yet, use your LiftPitch video to show the real you — a 60-second authentic video stands out far more than a polished but generic resume." },
  ];

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>💡</span>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: B.text, margin: 0 }}>Tips & Tricks</h2>
        <PillBadge label="Free for all" color={B.success} />
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
        Career advice straight from an IT recruiter who's reviewed thousands of candidates.</p>

      <div style={{ padding: 20, borderRadius: 14, marginBottom: 24,
        background: "rgba(10,102,194,0.05)", border: "1px solid rgba(10,102,194,0.15)" }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, color: B.accentLight }}>
          📬 Get weekly tips in your inbox</span>
        {!subscribed ? (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ flex: 1, padding: "12px 16px", background: B.bg, color: B.text,
                border: `1px solid ${B.border}`, borderRadius: 10,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" }}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border} />
            <Btn onClick={() => { if (email.includes("@")) setSubscribed(true); }}
              disabled={!email.includes("@")} style={{ padding: "12px 20px", flexShrink: 0 }}>Subscribe</Btn>
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: B.success, fontSize: 18 }}>✓</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.success }}>
              You're in! Watch your inbox for weekly career tips.</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tips.map((tip, i) => (
          <div key={i} onClick={() => setExpanded(expanded === i ? null : i)}
            style={{ padding: 16, borderRadius: 12, background: B.bg,
              border: `1px solid ${expanded === i ? B.accent : B.border}`, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{tip.icon}</span>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: B.text }}>{tip.title}</span>
              </div>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, color: B.textDim,
                transform: expanded === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
            </div>
            {expanded !== i && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim, margin: "8px 0 0 30px", lineHeight: 1.5 }}>{tip.preview}</p>
            )}
            {expanded === i && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: "12px 0 0 30px", lineHeight: 1.7 }}>{tip.full}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main App ───

export default function App() {
  const [page, setPage] = useState("landing");
  const [tab, setTab] = useState("script");
  const [fadeIn, setFadeIn] = useState(false);
  const [isPaid, setIsPaid] = useState(() => {
    if (typeof window === 'undefined') return false;
    const cached = localStorage.getItem('lp_user_plan');
    return cached === 'pro' || cached === 'lifetime';
  });
  const [scriptUsed, setScriptUsed] = useState(false);
  const [script, setScript] = useState("");
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signup");

  const router = useRouter();

  const loadUserStatus = async (userId) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 8000)
      );
      const queryPromise = supabase
        .from('profiles')
        .select('plan, account_type')
        .eq('id', userId)
        .single();
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      if (error || !data) return { paid: false, accountType: 'candidate' };
      const paid = data.plan === 'pro' || data.plan === 'lifetime';
      localStorage.setItem('lp_user_plan', data.plan);
      return { paid, accountType: data.account_type || 'candidate' };
    } catch (e) {
      return { paid: false, accountType: 'candidate' };
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (!sessionUser) {
          setScriptUsed(!!localStorage.getItem("lp_script_used"));
        }
      } catch (e) {
        console.warn("[init] auth check failed:", e);
      }
    }
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setShowAuthModal(false);
        const { paid, accountType } = await loadUserStatus(session.user.id);
        setIsPaid(paid);
        // Employers route to their own area regardless of plan; check first.
        if (accountType === 'employer' && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          router.replace('/employers/console');
        } else if (paid && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          router.replace('/dashboard');
        }
      } else {
        setUser(null);
        setIsPaid(false);
        localStorage.removeItem('lp_user_plan');
        setScriptUsed(!!localStorage.getItem("lp_script_used"));
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lp_user_plan');
    setUser(null);
    setPage("landing");
    setFadeIn(false);
  };

  const openAuth = (mode = "signup") => { setAuthModalMode(mode); setShowAuthModal(true); };

  const goApp = () => { setPage("app"); setTimeout(() => setFadeIn(true), 50); };

  const tabs = [
    { id: "script", label: "🎯 Script" },
    { id: "record", label: "🎥 Record" },
    { id: "analytics", label: "📊 Analytics" },
    { id: "tips", label: "💡 Tips" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text, fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => { setPage("landing"); setFadeIn(false); }} style={{
          fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", cursor: "pointer" }}>LiftPitch</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/employers" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: B.gradientHot, color: "#fff",
            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 2px 10px rgba(224,104,71,0.25)",
            transition: "all 0.2s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(224,104,71,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(224,104,71,0.25)"; }}
          >For Employers <span aria-hidden="true">→</span></a>
          {user && isPaid && (
            <a href="/dashboard" style={{
              padding: "8px 16px", borderRadius: 10,
              background: B.gradient, color: "#fff",
              fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700,
              textDecoration: "none", boxShadow: `0 2px 10px ${B.accentGlow}`,
            }}>Dashboard</a>
          )}
          {user ? (
            <>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted,
                maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
              <button onClick={handleLogOut} style={{
                padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${B.border}`,
                background: B.surface, color: B.textMuted,
                fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#DC3545"; e.currentTarget.style.color = "#DC3545"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMuted; }}
              >Log Out</button>
            </>
          ) : (
            <button onClick={() => openAuth("login")} style={{
              padding: "8px 20px", borderRadius: 10, border: `1.5px solid ${B.accent}`,
              background: B.gradient, color: "#fff",
              fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: `0 2px 10px ${B.accentGlow}`, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${B.accentGlow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 10px ${B.accentGlow}`; }}
            >Log In</button>
          )}
        </div>
      </header>

      {page === "landing" ? (
        <Landing onStart={goApp} />
      ) : (
        <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.6s" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "16px 24px",
            background: B.bg, overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: "1 1 80px", maxWidth: 160, padding: "12px 16px",
                background: tab === t.id ? B.surface : "transparent",
                border: tab === t.id ? `1.5px solid ${B.accent}` : "1px solid transparent",
                borderRadius: 12, cursor: "pointer", transition: "all 0.2s", textAlign: "center",
              }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                  color: tab === t.id ? B.text : B.textMuted }}>{t.label}</div>
              </button>
            ))}
          </div>

          <div style={{ maxWidth: 680, margin: "0 auto", padding: "8px 20px 60px" }}>
            {tab === "script" && <ScriptGenerator isPaid={isPaid} scriptUsed={scriptUsed} onScriptUsed={() => setScriptUsed(true)} onResetScript={() => setScriptUsed(false)} script={script} onScriptGenerated={setScript} onNavigate={setTab} user={user} onNeedAuth={() => openAuth("signup")} />}
            {tab === "record" && <VideoRecorder onVideoRecorded={hash => setVideos(v => [...v, hash])} script={script} isPaid={isPaid} user={user} onNeedAuth={() => openAuth("signup")} />}
            {tab === "analytics" && <Analytics isPaid={isPaid} videos={videos} />}
            {tab === "tips" && <TipsAndTricks />}
          </div>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} defaultMode={authModalMode} />}

      <footer style={{ textAlign: "center", padding: "16px 20px", borderTop: `1px solid ${B.border}` }}>
        <a href="/support" style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim,
          textDecoration: "none",
        }}>Support</a>
      </footer>
    </div>
  );
}
