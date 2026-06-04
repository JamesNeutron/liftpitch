"use client";

import { useState } from "react";

// Brand palette — mirrors LiftPitchApp.jsx so this page feels native.
const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", surfaceHover: "#EDF0F5",
  card: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642", successGlow: "rgba(5,118,66,0.15)",
  warning: "#E7A33E", danger: "#DC3545",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
  gradientHot: "linear-gradient(135deg, #0A66C2 0%, #E06847 100%)",
};

const SORA = "'Sora', sans-serif";
const DM = "'DM Sans', sans-serif";

// Status → color mapping for keyword tags.
const KW = {
  found: { label: "Found", bg: "rgba(5,118,66,0.1)", border: "rgba(5,118,66,0.35)", color: B.success, dot: B.success },
  partial: { label: "Partial", bg: "rgba(231,163,62,0.12)", border: "rgba(231,163,62,0.4)", color: "#B27A12", dot: B.warning },
  missing: { label: "Missing", bg: "rgba(220,53,69,0.08)", border: "rgba(220,53,69,0.35)", color: B.danger, dot: B.danger },
};

function CopyButton({ text, label = "Copy", small = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        padding: small ? "6px 12px" : "10px 18px",
        borderRadius: 10,
        border: `1.5px solid ${copied ? B.success : B.border}`,
        background: copied ? "rgba(5,118,66,0.08)" : B.surface,
        color: copied ? B.success : B.textMuted,
        fontFamily: SORA, fontSize: small ? 12 : 13, fontWeight: 600,
        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function ScoreRing({ score }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? B.success : score >= 50 ? B.warning : B.danger;
  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={70} cy={70} r={radius} fill="none" stroke={B.border} strokeWidth={12} />
        <circle
          cx={70} cy={70} r={radius} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: SORA, fontSize: 34, fontWeight: 800, color }}>{score}%</span>
        <span style={{ fontFamily: SORA, fontSize: 10, fontWeight: 700, color: B.textDim,
          textTransform: "uppercase", letterSpacing: "0.1em" }}>Match</span>
      </div>
    </div>
  );
}

export default function ResumeRefiner() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canAnalyze = resume.trim().length > 40 && jobDesc.trim().length > 40 && !loading;

  const analyze = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/refine-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const textAreaStyle = {
    width: "100%", minHeight: 320, padding: 16, background: "#FFFFFF", color: B.text,
    border: `1px solid ${B.border}`, borderRadius: 12,
    fontFamily: DM, fontSize: 14, resize: "vertical", outline: "none",
    lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text, fontFamily: DM }}>
      {/* ── Header (mirrors LiftPitch app header) ── */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/" style={{
          fontFamily: SORA, fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", cursor: "pointer", textDecoration: "none",
        }}>LiftPitch</a>
        <a href="/" style={{
          padding: "8px 20px", borderRadius: 10, border: `1.5px solid ${B.accent}`,
          background: B.gradient, color: "#fff",
          fontFamily: SORA, fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: `0 2px 10px ${B.accentGlow}`, textDecoration: "none",
        }}>Home</a>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(32px, 6vw, 56px) 20px 80px" }}>
        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-block", padding: "6px 14px", borderRadius: 100,
            background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.18)",
            fontFamily: SORA, fontSize: 11, fontWeight: 700, color: B.accent,
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
          }}>Free ATS Tool</div>
          <h1 style={{
            fontFamily: SORA, fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 800,
            lineHeight: 1.1, marginBottom: 16,
            background: B.gradientHot, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Resume Refiner</h1>
          <p style={{
            fontFamily: DM, fontSize: "clamp(16px, 2.2vw, 19px)", color: B.textMuted,
            maxWidth: 620, margin: "0 auto", lineHeight: 1.6,
          }}>
            Paste your resume and a job description. We&apos;ll score your ATS match,
            surface the keywords that matter, and rewrite your bullets — using only your
            real experience, never inventing a thing.
          </p>
        </div>

        {/* ── Inputs ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20, marginBottom: 24,
        }}>
          <div>
            <label style={{
              fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
            }}>📄 Your Resume</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste the full text of your resume here…"
              style={textAreaStyle}
              onFocus={(e) => (e.target.style.borderColor = B.accent)}
              onBlur={(e) => (e.target.style.borderColor = B.border)}
            />
          </div>
          <div>
            <label style={{
              fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
            }}>🎯 Job Description</label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job posting you&apos;re applying to…"
              style={textAreaStyle}
              onFocus={(e) => (e.target.style.borderColor = B.accent)}
              onBlur={(e) => (e.target.style.borderColor = B.border)}
            />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button
            onClick={analyze}
            disabled={!canAnalyze}
            style={{
              padding: "16px 48px", borderRadius: 14, border: "none",
              fontFamily: SORA, fontWeight: 600, fontSize: 16, letterSpacing: "0.02em",
              background: B.gradient, color: "#fff",
              boxShadow: `0 4px 24px ${B.accentGlow}`,
              cursor: canAnalyze ? "pointer" : "not-allowed",
              opacity: canAnalyze ? 1 : 0.5, transition: "all 0.3s",
            }}
          >
            {loading ? "Analyzing…" : "Analyze My Resume"}
          </button>
          <p style={{ fontFamily: DM, fontSize: 13, color: B.textDim, marginTop: 12 }}>
            We never fabricate experience — every suggestion comes from your real resume.
          </p>
        </div>

        {error && (
          <div style={{
            maxWidth: 620, margin: "16px auto 0", padding: "14px 18px", borderRadius: 12,
            background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.3)",
            color: B.danger, fontFamily: DM, fontSize: 14, textAlign: "center",
          }}>{error}</div>
        )}

        {/* ── Results ── */}
        {result && (
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Score + summary */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
                <ScoreRing score={result.matchScore} />
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h2 style={{ fontFamily: SORA, fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                    Your ATS Match Score
                  </h2>
                  <p style={{ fontFamily: DM, fontSize: 15, color: B.textMuted, lineHeight: 1.6 }}>
                    {result.matchScore >= 75
                      ? "Strong match. Apply the keyword and bullet tweaks below to push it even higher."
                      : result.matchScore >= 50
                      ? "Decent match. There's clear room to surface more of the keywords this role is screening for."
                      : "This resume needs work to clear the ATS for this role. Focus on the missing keywords below."}
                  </p>
                </div>
              </div>
            </Card>

            {/* Keywords */}
            {result.keywords?.length > 0 && (
              <Card>
                <SectionHeader title="Keyword Analysis" subtitle={`${result.keywords.length} keywords pulled from the job description`} />
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
                  {Object.entries(KW).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: v.dot, display: "inline-block" }} />
                      <span style={{ fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textMuted }}>{v.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {result.keywords.map((kw, i) => {
                    const v = KW[kw.status] || KW.missing;
                    return (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "8px 14px", borderRadius: 100,
                        background: v.bg, border: `1px solid ${v.border}`,
                        fontFamily: DM, fontSize: 13.5, fontWeight: 500, color: v.color,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: v.dot }} />
                        {kw.keyword}
                      </span>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Bullet improvements */}
            {result.bulletImprovements?.length > 0 && (
              <Card>
                <SectionHeader title="Suggested Bullet Rewrites" subtitle="Stronger phrasing — built only from your real experience" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {result.bulletImprovements.map((b, i) => (
                    <div key={i} style={{
                      border: `1px solid ${B.border}`, borderRadius: 14, overflow: "hidden",
                    }}>
                      {b.original && (
                        <div style={{
                          padding: "12px 16px", background: B.surfaceHover,
                          borderBottom: `1px solid ${B.border}`,
                        }}>
                          <div style={{ fontFamily: SORA, fontSize: 10, fontWeight: 700, color: B.textDim,
                            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Before</div>
                          <div style={{ fontFamily: DM, fontSize: 14, color: B.textMuted, lineHeight: 1.5,
                            textDecoration: "line-through", textDecorationColor: B.textDim }}>{b.original}</div>
                        </div>
                      )}
                      <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: SORA, fontSize: 10, fontWeight: 700, color: B.success,
                            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>After</div>
                          <div style={{ fontFamily: DM, fontSize: 14.5, color: B.text, lineHeight: 1.6 }}>{b.improved}</div>
                        </div>
                        <CopyButton text={b.improved} small />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Full refined resume */}
            {result.fullResume && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  <SectionHeader title="Refined Resume" subtitle="Same facts, sharper wording and ATS-friendly keywords" noMargin />
                  <CopyButton text={result.fullResume} label="Copy Full Resume" />
                </div>
                <pre style={{
                  fontFamily: DM, fontSize: 14, color: B.text, lineHeight: 1.7,
                  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                  background: B.surfaceHover, border: `1px solid ${B.border}`,
                  borderRadius: 12, padding: 20,
                }}>{result.fullResume}</pre>
              </Card>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px 20px", borderTop: `1px solid ${B.border}` }}>
        <a href="/support" style={{ fontFamily: DM, fontSize: 12, color: B.textDim, textDecoration: "none" }}>Support</a>
      </footer>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: B.card, border: `1px solid ${B.border}`, borderRadius: 20,
      padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style,
    }}>{children}</div>
  );
}

function SectionHeader({ title, subtitle, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 20 }}>
      <h2 style={{ fontFamily: SORA, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: DM, fontSize: 14, color: B.textMuted }}>{subtitle}</p>}
    </div>
  );
}
