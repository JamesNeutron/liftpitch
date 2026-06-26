"use client";

// Brand palette — mirrors /employers so this page feels native.
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

// Inline Lucide-style icons (24x24, stroke-based) — matches /employers; no dependency.
function Icon({ paths, size = 18, color = B.success, strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}

const ICONS = {
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};

const TIERS = [
  {
    name: "Starter",
    price: "$99",
    roles: "Up to 2 active roles",
    blurb: "For a single team filling a couple of seats.",
    features: [
      "Up to 2 active roles",
      "Live-verified video pitches",
      "Works inside your existing ATS",
      "Video links in every candidate profile",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "$249",
    roles: "Up to 8 active roles",
    blurb: "For teams hiring across several roles at once.",
    features: [
      "Up to 8 active roles",
      "Live-verified video pitches",
      "Works inside your existing ATS",
      "Video links in every candidate profile",
      "Priority pilot support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: "$499",
    roles: "Unlimited active roles",
    blurb: "For high-volume and multi-team hiring.",
    features: [
      "Unlimited active roles",
      "Live-verified video pitches",
      "Works inside your existing ATS",
      "Video links in every candidate profile",
      "Priority pilot support",
    ],
    popular: false,
  },
];

function Section({ children, bg = B.surface, pad = "clamp(56px, 8vw, 96px) 24px" }) {
  return (
    <section style={{ background: bg, padding: pad }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function TierCard({ tier }) {
  const popular = tier.popular;
  return (
    <div style={{
      position: "relative",
      background: popular ? "linear-gradient(160deg, #0A66C2 0%, #1a7fd4 60%, #378FE9 100%)" : B.surface,
      border: popular ? "none" : `1px solid ${B.border}`,
      borderRadius: 20, padding: "34px 30px",
      display: "flex", flexDirection: "column",
      boxShadow: popular ? "0 16px 48px rgba(10,102,194,0.28)" : "0 2px 12px rgba(42,80,128,0.06)",
      transform: popular ? "scale(1.02)" : "none",
    }}>
      {popular && (
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #E06847, #e87d5a)", color: "#fff",
          padding: "5px 18px", borderRadius: 100,
          fontFamily: SORA, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
          boxShadow: "0 4px 14px rgba(224,104,71,0.4)",
        }}>Most Popular</div>
      )}

      <div style={{
        fontFamily: SORA, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", marginBottom: 14,
        color: popular ? "rgba(255,255,255,0.8)" : B.textMuted,
      }}>{tier.name}</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: SORA, fontSize: 48, fontWeight: 800, lineHeight: 1,
          color: popular ? "#fff" : B.text }}>{tier.price}</span>
        <span style={{ fontFamily: DM, fontSize: 16, lineHeight: 1.6,
          color: popular ? "rgba(255,255,255,0.75)" : B.textMuted }}>/mo</span>
      </div>

      <div style={{ fontFamily: SORA, fontSize: 14, fontWeight: 700, marginBottom: 8,
        color: popular ? "#fff" : B.accent }}>{tier.roles}</div>

      <p style={{ fontFamily: DM, fontSize: 14, lineHeight: 1.55, margin: "0 0 24px",
        color: popular ? "rgba(255,255,255,0.85)" : B.textMuted }}>{tier.blurb}</p>

      <a href="/employers/signup" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 0", borderRadius: 12, marginBottom: 26,
        background: popular ? "#fff" : B.gradient,
        color: popular ? B.accent : "#fff",
        fontFamily: SORA, fontSize: 15, fontWeight: 700, textDecoration: "none",
        boxShadow: popular ? "0 6px 20px rgba(0,0,0,0.18)" : `0 4px 16px ${B.accentGlow}`,
        transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        Start Free Pilot
        <Icon paths={ICONS.arrow} size={17} color={popular ? B.accent : "#fff"} />
      </a>

      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {tier.features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <span style={{ flexShrink: 0, marginTop: 2 }}>
              <Icon paths={ICONS.check} size={17} color={popular ? "#fff" : B.success} />
            </span>
            <span style={{ fontFamily: DM, fontSize: 14.5, lineHeight: 1.5,
              color: popular ? "rgba(255,255,255,0.92)" : B.textMuted }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployerPricing() {
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
            fontFamily: SORA, fontSize: 13, fontWeight: 600, color: B.textMuted, textDecoration: "none",
          }}>For Candidates</a>
          <a href="/employers" style={{
            fontFamily: SORA, fontSize: 13, fontWeight: 600, color: B.textMuted, textDecoration: "none",
          }}>Overview</a>
        </div>
      </header>

      {/* Hero */}
      <Section bg={B.surface} pad="clamp(56px, 8vw, 88px) 24px clamp(32px, 5vw, 48px)">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 16px", borderRadius: 100, marginBottom: 22,
            background: "rgba(5,118,66,0.08)", border: "1px solid rgba(5,118,66,0.25)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: B.success }} />
            <span style={{ fontFamily: SORA, fontSize: 12.5, fontWeight: 700, color: B.success }}>
              Currently onboarding pilot partners — start free, no card required.
            </span>
          </div>
          <h1 style={{
            fontFamily: SORA, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 18px", color: B.text,
          }}>
            Simple pricing that scales with your hiring.
          </h1>
          <p style={{
            fontFamily: DM, fontSize: "clamp(16px, 2vw, 19px)", color: B.textMuted,
            lineHeight: 1.6, margin: 0,
          }}>
            Pick the plan that fits how many roles you&rsquo;re filling. Every plan starts free
            during the pilot — you only see the real candidate, never a credit-card form.
          </p>
        </div>
      </Section>

      {/* Tiers */}
      <Section bg={B.bg} pad="clamp(24px, 4vw, 40px) 24px clamp(40px, 6vw, 64px)">
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 52px)" }}>
          <a href="/employers/signup" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "20px 56px", borderRadius: 16, background: B.gradientHot, color: "#fff",
            fontFamily: SORA, fontSize: "clamp(18px, 2.2vw, 22px)", fontWeight: 800,
            letterSpacing: "-0.01em", textDecoration: "none",
            boxShadow: "0 12px 40px rgba(10,102,194,0.35)", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 18px 52px rgba(10,102,194,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(10,102,194,0.35)"; }}
          >
            Start Free Pilot
            <Icon paths={ICONS.arrow} size={24} color="#fff" strokeWidth={2.5} />
          </a>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24, alignItems: "start",
        }}>
          {TIERS.map(t => <TierCard key={t.name} tier={t} />)}
        </div>

        <p style={{
          textAlign: "center", fontFamily: DM, fontSize: 14.5, color: B.textMuted,
          margin: "40px auto 0", maxWidth: 560, lineHeight: 1.6,
        }}>
          Free during the pilot. No credit card required, and you can cancel anytime —
          prices above reflect standard pricing once the pilot ends.
        </p>
      </Section>

      <footer style={{ textAlign: "center", padding: "24px 20px", borderTop: `1px solid ${B.border}` }}>
        <a href="/support" style={{ fontFamily: DM, fontSize: 12, color: B.textDim, textDecoration: "none" }}>
          Support
        </a>
      </footer>
    </div>
  );
}
