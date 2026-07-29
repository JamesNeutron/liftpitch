"use client";

import { useState, useEffect } from "react";
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

// ─── Landing Page ───

// Static demo date shown on the sample verified-pitch card + recording mockup.
const DEMO_DATE = "Jul 3, 2026";

// Shared styling for the "How it works" React mockups — a light card holding an
// inner white card / dark video area.
const mockCard = {
  background: "#F7F9FC", borderRadius: 20, padding: 20,
  border: `1px solid ${B.border}`,
  boxShadow: "0 16px 44px rgba(10,102,194,0.10), 0 3px 12px rgba(0,0,0,0.05)",
  width: "100%", maxWidth: 460, margin: "0 auto",
};
const innerCard = { background: "#FFFFFF", borderRadius: 14, padding: 16, border: `1px solid ${B.border}` };
const mockEyebrow = {
  fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700,
  letterSpacing: "0.12em", textTransform: "uppercase", color: B.textDim, margin: "0 0 14px",
};

// Dark "principles" band content — our promise to candidates and employers.
const principles = [
  { icon: "live", title: "Every intro recorded live", sub: "No uploads. No AI-generated fakes." },
  { icon: "noai", title: "Never scored by AI", sub: "No rankings, no grades, no auto-rejects." },
  { icon: "humans", title: "Humans review humans", sub: "You decide who to screen — we just help you meet them first." },
];

// Full-width section band — stretches edge to edge with its own background,
// while keeping inner content centered at a constrained max-width.
function Section({ bg, pad, children, id, style = {} }) {
  return (
    <section id={id} style={{
      width: "100%", background: bg,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: pad || "clamp(56px, 8vw, 96px) 20px",
      ...style,
    }}>
      {children}
    </section>
  );
}

// Built-in-React "verified pitch card" for the hero — a white rounded card with
// a dark 16:9 video area (centered avatar, Live Verified pill, play icon) over a
// candidate name + "recorded live" line. Replaces the old product screenshot.
function VerifiedPitchCard() {
  return (
    <div style={{
      width: "100%", maxWidth: 480, margin: "0 auto",
      background: "#FFFFFF", borderRadius: 24, padding: 16,
      border: `1px solid ${B.border}`,
      boxShadow: "0 24px 64px rgba(10,102,194,0.16), 0 4px 16px rgba(0,0,0,0.06)",
    }}>
      {/* Dark 16:9 video area */}
      <div style={{
        position: "relative", width: "100%", aspectRatio: "16 / 9",
        borderRadius: 16, overflow: "hidden",
        background: "radial-gradient(120% 120% at 50% 30%, #26314F 0%, #141A2E 72%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Candidate photo filling the frame */}
        <img src="/hero-candidate.jpg" alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          objectPosition: "center top",
        }} />

        {/* Live Verified pill, top-right */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 11px", borderRadius: 100,
          background: "rgba(5,118,66,0.92)", boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
          <span style={{
            fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff",
          }}>Live Verified</span>
        </div>

        {/* Play icon, bottom-left */}
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(255,255,255,0.16)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path d="M1 1.2L11 7L1 12.8V1.2Z" fill="#fff" />
          </svg>
        </div>
      </div>

      {/* Candidate name + recorded-live line */}
      <div style={{ padding: "16px 8px 6px" }}>
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: B.text,
        }}>Michelle K. — Customer Service Manager</div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim, marginTop: 4,
        }}>Recorded live · {DEMO_DATE}</div>
      </div>
    </div>
  );
}

// Tinted icon badge for the dark "principles" band.
function PrincipleIcon({ type }) {
  const wrap = (tint, node) => (
    <div style={{
      width: 52, height: 52, borderRadius: 14, marginBottom: 18,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: tint.bg, border: `1px solid ${tint.br}`,
    }}>{node}</div>
  );
  if (type === "live") return wrap(
    { bg: "rgba(224,104,71,0.14)", br: "rgba(224,104,71,0.32)" },
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" fill="#F0805F" />
      <circle cx="12" cy="12" r="9" stroke="#F0805F" strokeWidth="1.6" opacity="0.5" />
    </svg>
  );
  if (type === "noai") return wrap(
    { bg: "rgba(55,143,233,0.14)", br: "rgba(55,143,233,0.32)" },
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#69A9F0" strokeWidth="1.8" />
      <line x1="6" y1="18" x2="18" y2="6" stroke="#69A9F0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  return wrap(
    { bg: "rgba(34,163,102,0.16)", br: "rgba(34,163,102,0.32)" },
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="#3ECB8B" strokeWidth="1.8" />
      <circle cx="16.5" cy="9" r="2.4" stroke="#3ECB8B" strokeWidth="1.6" />
      <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#3ECB8B" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.6 19c0-1.9 1-3.6 2.6-4.2" stroke="#3ECB8B" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Step 1 mockup — the employer console: brand colors + a role card with a
// copyable recording link.
function ConsoleMockup() {
  return (
    <div style={mockCard}>
      <p style={mockEyebrow}>Your console</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "#0A66C2", boxShadow: "0 2px 6px rgba(10,102,194,0.3)" }} />
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "#E06847", boxShadow: "0 2px 6px rgba(224,104,71,0.3)" }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: B.textMuted }}>Your brand colors</span>
      </div>
      <div style={innerCard}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: B.text }}>Lead Recruiter</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: B.textMuted, margin: "4px 0 14px" }}>2 short questions · warm and human</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            flex: 1, minWidth: 0, padding: "8px 12px", borderRadius: 8,
            background: B.bg, border: `1px solid ${B.border}`,
            fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: B.textMuted,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>lift-pitch.co/r/…</span>
          <button style={{
            padding: "8px 16px", borderRadius: 8, border: "none", background: "#0A66C2",
            color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 12.5, fontWeight: 700,
            cursor: "default", flexShrink: 0,
          }}>Copy</button>
        </div>
      </div>
    </div>
  );
}

// Step 2 mockup — the employer's existing ATS application, with the LiftPitch
// question and a paste-your-link field dropped in.
function AtsMockup() {
  return (
    <div style={mockCard}>
      <p style={mockEyebrow}>Your existing ATS application</p>
      <div style={innerCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: "rgba(224,104,71,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Sora', sans-serif", fontSize: 8, fontWeight: 800, color: "#C4552E", letterSpacing: "0.04em",
          }}>PDF</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.text, fontWeight: 500 }}>example_resume.pdf</span>
          <span style={{ marginLeft: "auto", color: B.success, fontSize: 15, fontWeight: 700 }}>✓</span>
        </div>
        <div style={{ height: 1, background: B.border, margin: "14px 0" }} />
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 700, color: B.text,
          lineHeight: 1.5, marginBottom: 12,
        }}>Would you record a quick video intro using LiftPitch?</div>
        <div style={{
          padding: "12px 14px", borderRadius: 10, border: `1.5px dashed ${B.textDim}`,
          fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: B.textDim,
        }}>Paste your LiftPitch video link here…</div>
      </div>
    </div>
  );
}

// Step 3 mockup — the candidate's branded recording page mid-take.
function RecordMockup() {
  return (
    <div style={mockCard}>
      <p style={mockEyebrow}>The candidate&rsquo;s recording page — your brand</p>
      <div style={{
        position: "relative", width: "100%", aspectRatio: "16 / 9",
        borderRadius: 14, overflow: "hidden", marginBottom: 14,
        background: "radial-gradient(120% 120% at 50% 35%, #26314F 0%, #141A2E 72%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="/howitworks-3-record.png" alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
        }} />
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 600, color: B.text, lineHeight: 1.55,
      }}>1. Tell us a bit about yourself and why this role is exciting to you.</div>
    </div>
  );
}

function Landing({ onStart }) {
  // Hero trust chips, tinted by color family (green / blue / coral).
  const heroChips = [
    { t: "Live-verified", bg: "rgba(5,118,66,0.08)", br: "rgba(5,118,66,0.22)", fg: "#057642", dot: "#057642" },
    { t: "Drops into any ATS", bg: "rgba(10,102,194,0.08)", br: "rgba(10,102,194,0.22)", fg: "#0A66C2", dot: "#0A66C2" },
    { t: "Never scored by AI", bg: "rgba(224,104,71,0.08)", br: "rgba(224,104,71,0.24)", fg: "#C4552E", dot: "#E06847" },
  ];

  // How-it-works steps: React mockup + the (unchanged) step copy.
  const hiw = [
    { title: "Set up your roles & company branding", mock: <ConsoleMockup /> },
    { title: "Add your link to the post's application questions", mock: <AtsMockup /> },
    { title: "Receive real, verified candidate intros", mock: <RecordMockup /> },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      width: "100%", overflow: "hidden",
    }}>

      {/* ── Hero — subtle dot grid over light gray ── */}
      <Section
        bg="#F5F7FA"
        style={{
          backgroundImage: "radial-gradient(#C9D4E0 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        pad="clamp(48px, 6vw, 80px) 20px clamp(40px, 5vw, 64px)"
      >
      <div className="hero-grid">
        {/* Left column — copy */}
        <div>
          <p style={{
            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: B.accent,
            letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 18px",
          }}>
            For Employers
          </p>

          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: "clamp(30px, 4.4vw, 50px)", fontWeight: 800,
            lineHeight: 1.12, letterSpacing: "-0.02em", color: B.text, margin: "0 0 20px",
          }}>
            Walk into your first-round screens like they&rsquo;re a warm meeting.
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(16px, 1.4vw, 19px)", color: B.textMuted,
            lineHeight: 1.7, margin: "0 0 32px", maxWidth: 540,
          }}>
            LiftPitch adds candidate video intros to your job-post workflow — so you can assess for
            culture and cut through the AI noise before you decide who to screen.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/employers/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 36px", borderRadius: 14,
              background: B.gradientHot, color: "#fff", textDecoration: "none",
              fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.01em",
              boxShadow: "0 8px 28px rgba(10,102,194,0.22)", transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(10,102,194,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(10,102,194,0.22)"; }}
            >
              Start Free Pilot →
            </a>
          </div>

          {/* Trust chips — tinted */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            {heroChips.map(c => (
              <span key={c.t} style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px",
                borderRadius: 100, background: c.bg, border: `1px solid ${c.br}`,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: c.fg,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} /> {c.t}
              </span>
            ))}
          </div>
        </div>

        {/* Right column — verified pitch card */}
        <VerifiedPitchCard />
      </div>
      </Section>

      {/* ── Principles band (dark navy) — directly under the hero ── */}
      <Section bg="#1A1A2E" pad="clamp(56px, 7vw, 88px) 20px">
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: 11.5, fontWeight: 700,
          letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
          textAlign: "center", margin: "0 0 clamp(36px, 5vw, 56px)",
        }}>
          Our promise to your candidates — and to you
        </p>
        <div className="principles-grid">
          {principles.map(p => (
            <div key={p.title}>
              <PrincipleIcon type={p.icon} />
              <div style={{
                fontFamily: "'Sora', sans-serif", fontSize: "clamp(18px, 2vw, 21px)", fontWeight: 700,
                color: "#fff", lineHeight: 1.3, marginBottom: 8,
              }}>{p.title}</div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6,
              }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </div>
      </Section>

      {/* ── How It Works — connected spine ── */}
      <Section bg="#FFFFFF" id="how-it-works" pad="clamp(48px, 6vw, 80px) 16px clamp(56px, 7vw, 96px)">
      <div style={{ maxWidth: 1340, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: 12, color: B.textDim, textAlign: "center",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10,
        }}>How it works</p>
        <h2 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
          color: B.text, textAlign: "center", margin: "0 auto clamp(48px, 6vw, 80px)", maxWidth: 620, lineHeight: 1.22,
        }}>
          From open role to verified intro — in three steps
        </h2>
        <div className="hiw-spine">
          {hiw.map((s, i) => (
            <div key={s.title} className={`spine-step${i % 2 === 1 ? " spine-step--reverse" : ""}`}>
              <div className="spine-node">
                <div className="node-circle">{i + 1}</div>
              </div>
              <div className="spine-mock">{s.mock}</div>
              <div className="spine-text">
                <span style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 100,
                  background: "rgba(10,102,194,0.08)", color: B.accent,
                  fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
                }}>Step {i + 1}</span>
                <div style={{
                  fontFamily: "'Sora', sans-serif", fontSize: "clamp(22px, 2.2vw, 30px)",
                  fontWeight: 700, color: B.text, lineHeight: 1.28,
                }}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </Section>

      {/* ── Final CTA — dark navy ── */}
      <Section bg="#1A1A2E" pad="clamp(56px, 7vw, 96px) 20px">
      <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 24px",
          background: "rgba(224,104,71,0.16)", border: "1px solid rgba(224,104,71,0.32)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="#F0805F" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="#F0805F" strokeWidth="1.8" />
            <line x1="4" y1="20" x2="20" y2="4" stroke="#F0805F" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h2 style={{
          fontFamily: "'Sora', sans-serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800,
          color: "#fff", margin: "0 0 18px", lineHeight: 1.18,
        }}>Still screening resumes blind?</h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(15px, 2vw, 19px)",
          color: "rgba(255,255,255,0.7)", lineHeight: 1.75, margin: "0 auto 36px", maxWidth: 520,
        }}>
          Add a short video intro to the applications you already receive — and meet the
          real person before you spend a single screening call. Set up your first role in minutes.
        </p>
        <a href="/employers/signup" style={{
          display: "inline-block", padding: "18px 52px", borderRadius: 16,
          background: B.gradientHot, color: "#fff", textDecoration: "none",
          fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 8px 28px rgba(224,104,71,0.35)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(224,104,71,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(224,104,71,0.35)"; }}
        >
          Start Free Pilot →
        </a>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
          color: "rgba(255,255,255,0.5)", marginTop: 16 }}>
          Free during the pilot · No credit card · Works inside your ATS
        </p>
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

// ─── Main App ───

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signup");
  const [redirecting, setRedirecting] = useState(false);

  const router = useRouter();

  // Looks up the user's account type. Retries a few times on transient
  // failure. Critically, an inconclusive lookup returns accountType: null and
  // ok: false — we must NOT default to 'employer', or a hiccuped lookup would
  // wrongly route someone into the employer console.
  const loadAccountType = async (userId) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', userId)
          .single();
        if (!error && data) {
          // A successfully-read row with a null account_type is a legitimate
          // non-employer (employers are explicitly tagged 'employer').
          return { accountType: data.account_type || 'candidate', ok: true };
        }
      } catch (e) {
        // fall through to retry
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return { accountType: null, ok: false };
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          // Show the redirecting cue optimistically so a logged-in employer
          // never sees the email+logout limbo. The INITIAL_SESSION handler
          // below resolves it (redirect, or clear it for a non-employer).
          setRedirecting(true);
        }
      } catch (e) {
        console.warn("[init] auth check failed:", e);
      }
    }
    init();
    // NOTE: this callback is intentionally synchronous. Awaiting Supabase
    // queries inside it holds GoTrue's auth lock and caused ~8s of contention
    // before redirect. We defer the profile lookup with setTimeout so the lock
    // releases first, then the lookup runs fast (~100ms).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setShowAuthModal(false);
        const shouldRoute = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
        if (shouldRoute) setRedirecting(true);
        setTimeout(async () => {
          const { accountType } = await loadAccountType(session.user.id);
          if (!shouldRoute) return;
          // Employers route to their own area; everyone else just stays on the
          // homepage. Never redirect an inconclusive lookup — just stay put.
          if (accountType === 'employer') {
            router.replace('/employers/console');
          } else {
            setRedirecting(false);
          }
        }, 0);
      } else {
        setUser(null);
        setRedirecting(false);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const openAuth = (mode = "signup") => { setAuthModalMode(mode); setShowAuthModal(true); };

  if (redirecting) {
    return (
      <div style={{
        minHeight: "100vh", background: B.bg, color: B.text,
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 20, padding: 24,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `3px solid ${B.surfaceHover}`, borderTopColor: B.accent,
          animation: "lpspin 0.8s linear infinite",
        }} />
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600,
          color: B.textMuted, textAlign: "center",
        }}>Redirecting you…</div>
        <style>{`@keyframes lpspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text, fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", justifyContent: "center",
        padding: "14px 20px 4px", background: "transparent",
      }}>
        <div style={{
          width: "100%", maxWidth: 1200,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px 10px 22px", borderRadius: 9999,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(14px)",
          border: `1px solid ${B.border}`,
          boxShadow: "0 8px 30px rgba(10,102,194,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{
          fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", cursor: "pointer" }}>LiftPitch</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/employers/pricing" style={{
            display: "inline-flex", alignItems: "center",
            padding: "8px 16px", borderRadius: 10,
            color: B.textMuted,
            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
            textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = B.accent; }}
            onMouseLeave={e => { e.currentTarget.style.color = B.textMuted; }}
          >Pricing</a>
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
        </div>
      </header>

      <Landing />

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
