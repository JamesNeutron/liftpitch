"use client";

// Brand palette — mirrors LiftPitchApp.jsx so this page feels native.
const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", surfaceHover: "#EDF0F5",
  card: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642", successGlow: "rgba(5,118,66,0.15)",
  warning: "#E7A33E", coral: "#E06847",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
  gradientHot: "linear-gradient(135deg, #0A66C2 0%, #E06847 100%)",
};

const SORA = "'Sora', sans-serif";
const DM = "'DM Sans', sans-serif";

// Inline Lucide-style icons (24x24, stroke-based) — matches the hand-written
// SVG convention already used across LiftPitchApp.jsx; no new dependency.
function Icon({ paths, size = 24, color = B.accent, strokeWidth = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}

const ICONS = {
  // user-round
  personality: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </>
  ),
  // scan-face / signal-you-cant-fake (shield-check)
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // plug / works in your ATS
  plug: (
    <>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </>
  ),
  // video
  video: (
    <>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </>
  ),
  // eye / watch the real person
  eye: (
    <>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // arrow-right
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};

function PrimaryCTA({ children, href = "/employers/pricing", large = false }) {
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 9,
      padding: large ? "16px 32px" : "13px 26px", borderRadius: 12,
      background: B.gradient, color: "#fff",
      fontFamily: SORA, fontSize: large ? 16 : 15, fontWeight: 700,
      textDecoration: "none", boxShadow: `0 4px 20px ${B.accentGlow}`,
      transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${B.accentGlow}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${B.accentGlow}`; }}
    >
      {children}
      <Icon paths={ICONS.arrow} size={18} color="#fff" strokeWidth={2} />
    </a>
  );
}

function Section({ children, bg = B.surface, pad = "clamp(56px, 8vw, 96px) 24px" }) {
  return (
    <section style={{ background: bg, padding: pad }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function Eyebrow({ children, color = B.accent }) {
  return (
    <div style={{
      fontFamily: SORA, fontSize: 12.5, fontWeight: 700, color,
      letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16,
    }}>{children}</div>
  );
}

export default function Employers() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{
            fontFamily: SORA, fontSize: 13, fontWeight: 600, color: B.textMuted,
            textDecoration: "none",
          }}>For Candidates</a>
          <a href="/employers/pricing" style={{
            padding: "8px 18px", borderRadius: 10, background: B.gradient, color: "#fff",
            fontFamily: SORA, fontSize: 13, fontWeight: 700, textDecoration: "none",
            boxShadow: `0 2px 10px ${B.accentGlow}`,
          }}>Pricing</a>
        </div>
      </header>

      {/* a) HERO */}
      <Section bg={B.surface} pad="clamp(64px, 9vw, 112px) 24px clamp(48px, 7vw, 80px)">
        <div style={{ maxWidth: 760 }}>
          <Eyebrow>For Employers &amp; Hiring Teams</Eyebrow>
          <h1 style={{
            fontFamily: SORA, fontSize: "clamp(34px, 5.6vw, 60px)", fontWeight: 800,
            lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 22px", color: B.text,
          }}>
            See the real person behind the application.
          </h1>
          <p style={{
            fontFamily: DM, fontSize: "clamp(17px, 2.2vw, 20px)", color: B.textMuted,
            lineHeight: 1.6, margin: "0 0 36px", maxWidth: 620,
          }}>
            LiftPitch adds a short, live-verified video pitch to the applications you
            already receive — so you meet a genuine, on-camera candidate before you spend
            a single screening call.
          </p>
          <PrimaryCTA large>Start hiring with LiftPitch</PrimaryCTA>
        </div>
      </Section>

      {/* b) THE PROBLEM */}
      <Section bg={B.bg}>
        <Eyebrow color={B.coral}>The Problem</Eyebrow>
        <h2 style={{
          fontFamily: SORA, fontSize: "clamp(26px, 3.6vw, 40px)", fontWeight: 800,
          letterSpacing: "-0.01em", margin: "0 0 14px", color: B.text, maxWidth: 720,
        }}>
          A résumé can&rsquo;t tell you who someone is — and now it can&rsquo;t even tell you it&rsquo;s real.
        </h2>
        <p style={{
          fontFamily: DM, fontSize: 17, color: B.textMuted, lineHeight: 1.6,
          margin: "0 0 44px", maxWidth: 660,
        }}>
          Two problems are quietly making hiring harder and slower. LiftPitch was built to solve both.
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24,
        }}>
          {/* Personality roles */}
          <div style={{
            background: B.surface, border: `1px solid ${B.border}`, borderRadius: 18,
            padding: "32px 30px",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 13, marginBottom: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(10,102,194,0.08)",
            }}>
              <Icon paths={ICONS.personality} color={B.accent} />
            </div>
            <h3 style={{ fontFamily: SORA, fontSize: 21, fontWeight: 700, margin: "0 0 12px", color: B.text }}>
              When personality is the job
            </h3>
            <p style={{ fontFamily: DM, fontSize: 15.5, color: B.textMuted, lineHeight: 1.65, margin: 0 }}>
              For health coaches, customer service, sales, and care roles, who a person is
              <em> is</em> the qualification. A résumé tells you almost nothing about that.
              You find out on the call — after you&rsquo;ve already spent the time getting there.
            </p>
          </div>

          {/* AI noise */}
          <div style={{
            background: B.surface, border: `1px solid ${B.border}`, borderRadius: 18,
            padding: "32px 30px",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 13, marginBottom: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(224,104,71,0.1)",
            }}>
              <Icon paths={ICONS.shield} color={B.coral} />
            </div>
            <h3 style={{ fontFamily: SORA, fontSize: 21, fontWeight: 700, margin: "0 0 12px", color: B.text }}>
              Hiring is drowning in AI noise
            </h3>
            <p style={{ fontFamily: DM, fontSize: 15.5, color: B.textMuted, lineHeight: 1.65, margin: 0 }}>
              Applications are AI-polished and ATS-optimized to look identical. You can&rsquo;t
              tell the real candidates from the AI-assisted ones. LiftPitch is the signal you
              can&rsquo;t fake: a live, verified human on camera who has to survive a follow-up question.
            </p>
          </div>
        </div>
      </Section>

      {/* c) HOW IT WORKS */}
      <Section bg={B.surface}>
        <Eyebrow>How It Works</Eyebrow>
        <h2 style={{
          fontFamily: SORA, fontSize: "clamp(26px, 3.6vw, 40px)", fontWeight: 800,
          letterSpacing: "-0.01em", margin: "0 0 14px", color: B.text, maxWidth: 720,
        }}>
          It fits inside the hiring process you already run.
        </h2>
        <p style={{
          fontFamily: DM, fontSize: 17, color: B.textMuted, lineHeight: 1.6,
          margin: "0 0 48px", maxWidth: 660,
        }}>
          No new dashboard to learn, no migration. LiftPitch works inside the ATS you already
          use — Greenhouse, Lever, or your own application form.
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24,
        }}>
          {[
            {
              n: "01", icon: ICONS.plug, title: "Add one question",
              body: "Drop a video-pitch question into your existing application — the same form you post on Greenhouse or your careers page. Setup takes minutes.",
            },
            {
              n: "02", icon: ICONS.video, title: "Candidates record a live pitch",
              body: "Applicants record a short, live-verified pitch. It's captured on camera and verified as a real human in real time — not a pre-recorded or AI-generated clip.",
            },
            {
              n: "03", icon: ICONS.eye, title: "You watch before you call",
              body: "The video link lives right in the candidate's profile, alongside their résumé. You meet the real person before you spend a single screening call.",
            },
          ].map(step => (
            <div key={step.n} style={{
              background: B.bg, border: `1px solid ${B.border}`, borderRadius: 18,
              padding: "30px 28px",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20,
              }}>
                <Icon paths={step.icon} color={B.accent} />
                <span style={{ fontFamily: SORA, fontSize: 28, fontWeight: 800, color: B.border }}>{step.n}</span>
              </div>
              <h3 style={{ fontFamily: SORA, fontSize: 18.5, fontWeight: 700, margin: "0 0 10px", color: B.text }}>
                {step.title}
              </h3>
              <p style={{ fontFamily: DM, fontSize: 15, color: B.textMuted, lineHeight: 1.6, margin: 0 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* d) FOUNDER */}
      <Section bg={B.bg}>
        <div style={{
          display: "grid", gridTemplateColumns: "minmax(0, 280px) 1fr", gap: "clamp(28px, 5vw, 56px)",
          alignItems: "center",
        }}>
          <div style={{
            borderRadius: 20, overflow: "hidden", border: `1px solid ${B.border}`,
            background: B.surface, aspectRatio: "4 / 5", maxWidth: 320,
          }}>
            <img
              src="/albert-headshot.JPG"
              alt="Albert Kalinin, founder of LiftPitch"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div>
            <Eyebrow>From the Founder</Eyebrow>
            <h2 style={{
              fontFamily: SORA, fontSize: "clamp(24px, 3.2vw, 34px)", fontWeight: 800,
              letterSpacing: "-0.01em", margin: "0 0 20px", color: B.text, lineHeight: 1.2,
            }}>
              I spent years recruiting. I built LiftPitch to fix what broke.
            </h2>
            <div style={{ fontFamily: DM, fontSize: 16.5, color: B.textMuted, lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 16px" }}>
                I&rsquo;m a corporate and technical recruiter by trade — I spent years at TEKsystems,
                then went on to build out hiring at a health-tech startup. I&rsquo;ve screened
                thousands of résumés and sat through thousands of first calls.
              </p>
              <p style={{ margin: "0 0 16px" }}>
                Two things kept costing me real time. I couldn&rsquo;t tell who a candidate
                actually was until we were already on a call. And lately, I couldn&rsquo;t tell
                which applications were genuine and which were AI-polished to look perfect.
              </p>
              <p style={{ margin: 0 }}>
                I became a founder to solve exactly that — the AI noise and the
                personality-blindness of résumés. LiftPitch is the tool I wish I&rsquo;d had on
                the other side of the desk.
              </p>
              <p style={{
                fontFamily: SORA, fontSize: 15, fontWeight: 700, color: B.text, margin: "24px 0 0",
              }}>
                — Albert Kalinin, Founder
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* e) CLOSING CTA */}
      <Section bg={B.surface} pad="clamp(64px, 9vw, 104px) 24px">
        <div style={{
          background: "linear-gradient(160deg, #0A66C2 0%, #1a7fd4 55%, #378FE9 100%)",
          borderRadius: 24, padding: "clamp(40px, 6vw, 64px)", textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: SORA, fontSize: "clamp(26px, 3.6vw, 40px)", fontWeight: 800,
            letterSpacing: "-0.01em", margin: "0 0 16px", color: "#fff", lineHeight: 1.15,
          }}>
            Meet the real candidate first.
          </h2>
          <p style={{
            fontFamily: DM, fontSize: 17.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6,
            margin: "0 auto 32px", maxWidth: 520,
          }}>
            Cut the AI noise and stop guessing about fit. See verified, on-camera candidates
            before you ever pick up the phone.
          </p>
          <a href="/employers/pricing" style={{
            display: "inline-flex", alignItems: "center", gap: 9,
            padding: "16px 34px", borderRadius: 12, background: "#fff", color: B.accent,
            fontFamily: SORA, fontSize: 16, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Start hiring with LiftPitch
            <Icon paths={ICONS.arrow} size={18} color={B.accent} strokeWidth={2} />
          </a>
        </div>
      </Section>

      <footer style={{ textAlign: "center", padding: "24px 20px", borderTop: `1px solid ${B.border}` }}>
        <a href="/support" style={{ fontFamily: DM, fontSize: 12, color: B.textDim, textDecoration: "none" }}>
          Support
        </a>
      </footer>
    </div>
  );
}
