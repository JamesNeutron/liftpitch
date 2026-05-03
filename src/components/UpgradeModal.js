"use client";

const B = {
  accent: "#0A66C2",
  text: "#1A1A2E", textMuted: "#56687A",
  surface: "#FFFFFF", border: "#E2E8F0",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

export default function UpgradeModal({ feature = "script", onClose }) {
  const isScript = feature === "script";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(4px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 20px",
    }}>
      <div style={{
        background: B.surface, borderRadius: 20, padding: 36,
        maxWidth: 440, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
        <h2 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800,
          color: B.text, margin: "0 0 10px",
        }}>
          {isScript ? "Free script used" : "Free video used"}
        </h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.textMuted,
          lineHeight: 1.6, margin: "0 0 28px",
        }}>
          You&apos;ve used your free {isScript ? "AI script generation" : "video recording"}.
          Upgrade to unlock unlimited scripts, unlimited recordings, and remove the watermark from your videos.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{
            flex: 1, padding: "18px 16px", borderRadius: 14,
            border: `1.5px solid ${B.border}`, textAlign: "left",
          }}>
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
              color: B.textMuted, textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 8,
            }}>Pro Monthly</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text }}>
              $8<span style={{ fontSize: 14, fontWeight: 400, color: B.textMuted }}>/mo</span>
            </div>
          </div>
          <div style={{
            flex: 1, padding: "18px 16px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(10,102,194,0.06), rgba(55,143,233,0.06))",
            border: `1.5px solid ${B.accent}`, textAlign: "left",
          }}>
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
              color: B.accent, textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 8,
            }}>Lifetime Pass</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text }}>
              $35<span style={{ fontSize: 14, fontWeight: 400, color: B.textMuted }}> once</span>
            </div>
          </div>
        </div>

        <a href="/pricing" style={{
          display: "block", padding: "14px 28px", borderRadius: 12,
          background: B.gradient, color: "#fff", textDecoration: "none",
          fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
          boxShadow: "0 4px 20px rgba(10,102,194,0.25)",
          marginBottom: onClose ? 12 : 0,
        }}>
          View Pricing &amp; Upgrade →
        </a>

        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "none", padding: "8px",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: B.textMuted, cursor: "pointer",
          }}>
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}
