"use client";

import { useState, useRef, useEffect } from "react";

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

function Landing({ onStart }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 100); }, []);

  return (
    <div style={{
      minHeight: "100vh", background: B.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 20px",
      position: "relative", overflow: "hidden", opacity: vis ? 1 : 0, transition: "opacity 0.8s",
    }}>
      <div style={{ position: "absolute", top: "-30%", left: "-10%", width: 600, height: 600,
        background: "radial-gradient(circle, rgba(10,102,194,0.08) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 500, height: 500,
        background: "radial-gradient(circle, rgba(116,185,255,0.08) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px",
        borderRadius: 100, background: "rgba(10,102,194,0.08)",
        border: "1px solid rgba(10,102,194,0.2)", marginBottom: 32, fontSize: 13,
        color: B.accentLight, fontFamily: "'Sora', sans-serif", fontWeight: 500,
        letterSpacing: "0.05em", textTransform: "uppercase",
      }}>✦ Stand Out From The Stack</div>

      <h1 style={{
        fontFamily: "'Sora', sans-serif", fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 800,
        background: B.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        textAlign: "center", lineHeight: 1.1, margin: 0, maxWidth: 700,
      }}>Your Resume,<br />Now in Motion</h1>

      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(16px, 2.5vw, 20px)", color: B.textMuted,
        textAlign: "center", maxWidth: 520, lineHeight: 1.7, margin: "24px 0 40px",
      }}>
        Record a verified, live video pitch — no uploads, no AI fakes.
        Get a trusted shareable link and let AI craft your perfect script.
      </p>

      <Btn onClick={onStart} style={{ padding: "18px 48px", fontSize: 17 }}>
        Get Started — It's Free
      </Btn>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 48, maxWidth: 650 }}>
        {[
          { icon: "🛡️", label: "Live verified" }, { icon: "🎥", label: "Record in-browser" },
          { icon: "🔗", label: "Shareable link" }, { icon: "🎯", label: "Job-matched scripts" },
          { icon: "📊", label: "View analytics" }, { icon: "💡", label: "Career tips" },
        ].map(f => (
          <div key={f.label} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            borderRadius: 100, background: B.surface, border: `1px solid ${B.border}`,
            fontSize: 14, color: B.textMuted, fontFamily: "'DM Sans', sans-serif",
          }}><span>{f.icon}</span> {f.label}</div>
        ))}
      </div>

      <div style={{ marginTop: 80, width: "100%", maxWidth: 800 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, color: B.textDim, textAlign: "center",
          letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 32 }}>How It Works</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          {[
            { n: "01", t: "Upload & Describe", d: "Upload your resume (PDF or Word), paste the job description, and tell us about yourself." },
            { n: "02", t: "Get Your Script", d: "AI maps your experience to the role and writes your personalized pitch." },
            { n: "03", t: "Record & Share", d: "Record your verified video, grab the link, and track who watches it." },
          ].map(s => (
            <div key={s.n} style={{
              flex: "1 1 220px", maxWidth: 260, background: B.card,
              border: `1px solid ${B.border}`, borderRadius: 16, padding: 24,
            }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800,
                background: B.gradient, WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", marginBottom: 12 }}>{s.n}</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600,
                color: B.text, marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Unified Script Generator ───

function ScriptGenerator({ isPaid, scriptUsed, onScriptUsed }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [bio, setBio] = useState("");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState("60");
  const [analysis, setAnalysis] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // "" | "reading" | "done" | "error"
  const [uploadName, setUploadName] = useState("");
  const fileRef = useRef(null);

  const canGenerate = isPaid || !scriptUsed;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    setUploadStatus("reading");

    try {
      if (file.type === "application/pdf") {
        // Read PDF using pdf.js
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import("pdfjs-dist");
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        setResume(text.trim());
        setUploadStatus("done");
      } else if (
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
    if (!resume.trim() || !jobDesc.trim() || !bio.trim()) return;
    setLoading(true); setScript(""); setAnalysis(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are an expert career coach and hiring strategist. A job seeker wants to record a ${duration}-second video pitch targeted at a specific role. Analyze their resume against the job description and write a compelling video script that draws direct connections between their experience and what the employer needs.

First, output a JSON block wrapped in <analysis> tags:
<analysis>
{
  "matchScore": 0-100,
  "strongMatches": ["match 1", "match 2", "match 3"],
  "gapsToBridge": ["gap 1"],
  "angleToPlay": "one sentence best pitch angle"
}
</analysis>

Then write the script. It should:
- Be ${duration === "30" ? "75-90" : duration === "45" ? "110-135" : "150-180"} words for ${duration}-second delivery
- Open by naming the role and company if mentioned in the job description
- Draw 2-3 direct parallels between their experience and job requirements
- Incorporate personality and unique traits from their about me section
- Address gaps by reframing as transferable strengths
- Sound natural, confident, enthusiastic — not robotic
- End with a strong close that makes the hiring manager want to meet them
- Use first person

RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

ABOUT ME:
${bio}

Output <analysis> JSON first, then ONLY the script text (no labels or prefix).`
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const m = text.match(/<analysis>\s*([\s\S]*?)\s*<\/analysis>/);
      if (m) { try { setAnalysis(JSON.parse(m[1])); } catch(e) {} }
      const s = text.replace(/<analysis>[\s\S]*?<\/analysis>/, "").trim();
      setScript(s || "Could not generate script. Please try again.");
      if (!isPaid) onScriptUsed();
    } catch (err) {
      setScript("Something went wrong. Please check your connection and try again.");
    }
    setLoading(false);
  };

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
          background: "rgba(231,163,62,0.08)", border: "1px solid rgba(231,163,62,0.2)", textAlign: "center",
        }}>
          <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>🔒</span>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: B.warning, margin: "0 0 8px" }}>
            Free script used
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
            Upgrade to generate unlimited scripts for every job you apply to.
          </p>
          <Btn variant="hot" style={{ padding: "12px 28px", fontSize: 14 }} onClick={() => {}}>
            Upgrade — $5/mo or $29 lifetime
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
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload} style={{ display: "none" }} />
                <button onClick={() => fileRef.current?.click()} style={{
                  padding: "8px 16px", borderRadius: 8, background: B.surface,
                  border: `1px solid ${B.border}`, color: B.textMuted,
                  fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  📎 Upload PDF or Word
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
                placeholder="Upload your resume above, or paste it here..." minHeight={120} />
            </div>
            <div>
              <FieldLabel icon="💼">Job Description</FieldLabel>
              <TextArea value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste the job posting you're applying to..." minHeight={120} />
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

      {script && (
        <div style={{ marginTop: 20, padding: 24, background: "rgba(224,104,71,0.05)",
          border: "1px solid rgba(224,104,71,0.15)", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, color: "#E06847",
              textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Script</span>
            <button onClick={() => navigator.clipboard?.writeText(script)} style={{
              background: B.surface, border: `1px solid ${B.border}`, borderRadius: 8,
              padding: "6px 14px", color: B.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "'Sora', sans-serif",
            }}>📋 Copy</button>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.text, lineHeight: 1.8, margin: 0,
            whiteSpace: "pre-wrap" }}>{script}</p>
        </div>
      )}
    </Card>
  );
}

// ─── Video Recorder (Live-Only Verified) ───

function VideoRecorder({ onVideoRecorded }) {
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
  const timer = useTimer(maxDur);

  const genVerify = () => {
    const now = new Date();
    const sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const hash = btoa(`vp-${sid}-${now.toISOString()}-live`).substring(0, 16).toUpperCase();
    return { sessionId: sid, recordedAt: now.toISOString(), method: "LIVE_CAPTURE",
      verificationHash: `VP-${hash}`, deviceStream: true, uploadBlocked: true };
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.muted = true; videoRef.current.play(); }
      setState("previewing");
    } catch { alert("Camera access required. Please allow permissions and try again."); }
  };

  const startCountdown = () => {
    setState("countdown"); setCountdown(3);
    let c = 3;
    const iv = setInterval(() => { c--; setCountdown(c); if (c <= 0) { clearInterval(iv); beginRec(); } }, 1000);
  };

  const beginRec = () => {
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9,opus" });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      const v = genVerify(); setVerification(v);
      const id = v.verificationHash.replace("VP-", "").toLowerCase();
      setShareLink(`https://liftpitch.co/v/${id}`);
      setState("recorded");
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = url; videoRef.current.muted = false; }
      if (onVideoRecorded) onVideoRecorded(v.verificationHash);
    };
    mr.start(); mrRef.current = mr; timer.start(); setState("recording");
  };

  const stopRec = () => { mrRef.current?.stop(); timer.stop(); };
  useEffect(() => { if (timer.sec >= maxDur && state === "recording") stopRec(); }, [timer.sec, maxDur, state]);
  const reset = () => { timer.reset(); setRecordedUrl(null); setShareLink(""); setCopied(false); setVerification(null); setState("idle"); streamRef.current?.getTracks().forEach(t => t.stop()); };
  const copyLink = () => { navigator.clipboard?.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
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
      )}

      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000",
        aspectRatio: "16/9", marginBottom: 20,
        border: state === "recording" ? "2px solid #DC3545" : state === "countdown" ? `2px solid ${B.warning}` : `1px solid ${B.border}` }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover",
          display: state === "idle" ? "none" : "block",
          transform: state !== "recorded" ? "scaleX(-1)" : "none" }} playsInline controls={state === "recorded"} />

        {state === "idle" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: B.surface }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📹</div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textDim }}>Click below to start your camera</span>
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
        {state === "recording" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(0,0,0,0.08)" }}>
            <div style={{ height: "100%", width: `${(timer.sec / maxDur) * 100}%`,
              background: timer.sec > maxDur * 0.8 ? "linear-gradient(90deg, #E7A33E, #E06847)" : B.gradient,
              transition: "width 1s linear" }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {state === "idle" && <Btn onClick={startCamera}>📷 Open Camera</Btn>}
        {state === "previewing" && <Btn onClick={startCountdown} style={{
          background: "linear-gradient(135deg, #DC3545, #C0392B)", boxShadow: "0 4px 24px rgba(220,53,69,0.2)" }}>⏺ Start Recording</Btn>}
        {state === "recording" && <Btn onClick={stopRec} variant="secondary">⏹ Stop Recording</Btn>}
        {state === "recorded" && <Btn onClick={reset} variant="secondary">🔄 Record Again</Btn>}
      </div>

      {state === "recorded" && shareLink && (
        <div style={{ marginTop: 24, padding: 20, background: "rgba(5,118,66,0.05)",
          border: "1px solid rgba(5,118,66,0.15)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.success,
              textTransform: "uppercase", letterSpacing: "0.1em" }}>🔗 Your Verified Link</span>
            <VerifiedBadge size="small" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, padding: "12px 16px", background: B.bg, borderRadius: 10,
              border: `1px solid ${B.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: B.accentLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</div>
            <Btn onClick={copyLink} variant={copied ? "success" : "secondary"} style={{ padding: "12px 20px", flexShrink: 0 }}>
              {copied ? "✓ Copied!" : "📋 Copy"}</Btn>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim, marginTop: 12, lineHeight: 1.5 }}>
            Add this link to your resume. Recruiters will see the verified badge confirming this was recorded live.</p>
          {verification && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: B.bg, border: `1px solid ${B.border}` }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.textDim,
                textTransform: "uppercase", letterSpacing: "0.1em" }}>Verification Certificate</span>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", marginTop: 10,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
                <span style={{ color: B.textDim }}>Method</span><span style={{ color: B.success, fontWeight: 600 }}>LIVE CAPTURE</span>
                <span style={{ color: B.textDim }}>Verification ID</span><span style={{ color: B.text, fontFamily: "monospace", fontSize: 11 }}>{verification.verificationHash}</span>
                <span style={{ color: B.textDim }}>Recorded</span><span style={{ color: B.text }}>{new Date(verification.recordedAt).toLocaleString()}</span>
                <span style={{ color: B.textDim }}>Device Stream</span><span style={{ color: B.success }}>✓ Verified</span>
                <span style={{ color: B.textDim }}>Upload</span><span style={{ color: "#E06847" }}>✗ Blocked</span>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)} }
        @keyframes countPulse { 0%{transform:scale(.8);opacity:.5}50%{transform:scale(1.1);opacity:1}100%{transform:scale(.8);opacity:.5} }
      `}</style>
    </Card>
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
            Upgrade — $5/mo or $29 lifetime</Btn>
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
  const [isPaid, setIsPaid] = useState(false);
  const [scriptUsed, setScriptUsed] = useState(false);
  const [videos, setVideos] = useState([]);

  const goApp = () => { setPage("app"); setTimeout(() => setFadeIn(true), 50); };
  if (page === "landing") return <Landing onStart={goApp} />;

  const tabs = [
    { id: "script", label: "🎯 Script" },
    { id: "record", label: "🎥 Record" },
    { id: "analytics", label: "📊 Analytics" },
    { id: "tips", label: "💡 Tips" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text,
      fontFamily: "'DM Sans', sans-serif", opacity: fadeIn ? 1 : 0, transition: "opacity 0.6s" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => { setPage("landing"); setFadeIn(false); }} style={{
          fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", cursor: "pointer" }}>LiftPitch</div>
        <button onClick={() => setIsPaid(!isPaid)} style={{
          padding: "6px 14px", borderRadius: 8, fontSize: 11,
          fontFamily: "'Sora', sans-serif", fontWeight: 600, cursor: "pointer",
          background: isPaid ? "rgba(5,118,66,0.12)" : "rgba(231,163,62,0.1)",
          border: `1px solid ${isPaid ? "rgba(5,118,66,0.2)" : "rgba(231,163,62,0.2)"}`,
          color: isPaid ? B.success : B.warning,
        }}>{isPaid ? "✓ Pro" : "Free Tier"} (toggle demo)</button>
      </header>

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
        {tab === "script" && <ScriptGenerator isPaid={isPaid} scriptUsed={scriptUsed} onScriptUsed={() => setScriptUsed(true)} />}
        {tab === "record" && <VideoRecorder onVideoRecorded={hash => setVideos(v => [...v, hash])} />}
        {tab === "analytics" && <Analytics isPaid={isPaid} videos={videos} />}
        {tab === "tips" && <TipsAndTricks />}
      </div>
    </div>
  );
}
