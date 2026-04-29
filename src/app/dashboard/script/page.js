"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642",
  warning: "#E7A33E",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

function DashboardHeader({ email, onSignOut }) {
  return (
    <header style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <a href="/dashboard" style={{
        fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800,
        background: B.gradient, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent", textDecoration: "none",
      }}>LiftPitch</a>

      <nav style={{ display: "flex", gap: 4 }}>
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Record", href: "/dashboard/record" },
          { label: "My Videos", href: "/dashboard/videos" },
          { label: "Analytics", href: "/dashboard/analytics" },
        ].map(({ label, href }) => (
          <a key={href} href={href} style={{
            padding: "8px 16px", borderRadius: 10,
            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
            color: B.textMuted, textDecoration: "none", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = B.bg; e.currentTarget.style.color = B.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = B.textMuted; }}
          >{label}</a>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted,
          maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{email}</span>
        <button onClick={onSignOut} style={{
          padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${B.border}`,
          background: B.surface, color: B.textMuted,
          fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#DC3545"; e.currentTarget.style.color = "#DC3545"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMuted; }}
        >Log Out</button>
      </div>
    </header>
  );
}

function scoreColor(score) {
  if (score >= 75) return B.success;
  if (score >= 50) return B.warning;
  return "#E06847";
}

export default function DashboardScript() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [bio, setBio] = useState("");
  const [duration, setDuration] = useState("60");
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [script, setScript] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadName, setUploadName] = useState("");
  const fileRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedScript, setExpandedScript] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .single();

      if (profile?.plan !== "pro" && profile?.plan !== "lifetime") {
        router.replace("/");
        return;
      }

      setUser(session.user);
      setLoading(false);
      loadHistory(session.user.id);
    }
    init();
  }, [router]);

  const loadHistory = async (userId) => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from("scripts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setHistory(data || []);
    setHistoryLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

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
    if (fileRef.current) fileRef.current.value = "";
  };

  const generate = async () => {
    if (!resume.trim() || !jobDesc.trim() || !bio.trim()) return;
    setGenerating(true);
    setScript("");
    setAnalysis(null);
    setSavedId(null);

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDesc, bio, duration }),
      });
      const data = await response.json();
      const text = data.text || "";
      const m = text.match(/<analysis>\s*([\s\S]*?)\s*<\/analysis>/);
      let parsedAnalysis = null;
      if (m) { try { parsedAnalysis = JSON.parse(m[1]); } catch (e) {} }
      const scriptText = text.replace(/<analysis>[\s\S]*?<\/analysis>/, "").trim();
      setAnalysis(parsedAnalysis);
      setScript(scriptText || "Could not generate script. Please try again.");
    } catch {
      setScript("Something went wrong. Please check your connection and try again.");
    }
    setGenerating(false);
  };

  const saveScript = async () => {
    if (!script || !user) return;
    setSaving(true);
    const { data, error } = await supabase.from("scripts").insert({
      user_id: user.id,
      job_description: jobDesc,
      resume_text: resume,
      about_me: bio,
      script,
      match_score: analysis?.matchScore ?? null,
      strong_matches: analysis?.strongMatches ?? null,
      gaps_to_bridge: analysis?.gapsToBridge ?? null,
      angle_to_play: analysis?.angleToPlay ?? null,
      duration,
    }).select().single();

    if (!error && data) {
      setSavedId(data.id);
      setHistory(prev => [data, ...prev]);
    }
    setSaving(false);
  };

  const deleteScript = async (id) => {
    setDeletingId(id);
    await supabase.from("scripts").delete().eq("id", id);
    setHistory(prev => prev.filter(s => s.id !== id));
    if (expandedScript === id) setExpandedScript(null);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: B.bg }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%",
          border: "3px solid transparent", borderTopColor: B.accent,
          animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const canGenerate = !generating && resume.trim() && jobDesc.trim() && bio.trim();

  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader email={user?.email} onSignOut={handleSignOut} />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <a href="/dashboard" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textMuted,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
          }}
            onMouseEnter={e => e.currentTarget.style.color = B.accent}
            onMouseLeave={e => e.currentTarget.style.color = B.textMuted}
          >← Back to Dashboard</a>
        </div>

        {/* Heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800,
            color: B.text, margin: 0,
          }}>Generate Script</h1>
          <span style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
            fontFamily: "'Sora', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase",
            background: "linear-gradient(135deg, #057642, #046636)", color: "#0A0A0F",
          }}>Unlimited</span>
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted,
          lineHeight: 1.6, margin: "0 0 32px",
        }}>Upload your resume, paste the job description, and add a paragraph about yourself. Get a tailored pitch script in seconds.</p>

        {/* Generator card */}
        <div style={{
          background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
          padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 32,
        }}>
          {/* Duration */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
            }}>⏱ Script Duration</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["30", "45", "60"].map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  padding: "8px 20px", borderRadius: 8,
                  background: duration === d ? B.accent : B.surface,
                  color: duration === d ? "#fff" : B.textMuted,
                  border: `1px solid ${duration === d ? B.accent : B.border}`,
                  fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>{d}s</button>
              ))}
            </div>
          </div>

          {/* Resume */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
            }}>📄 Your Resume</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input ref={fileRef} type="file" accept=".docx,.doc,.txt" onChange={handleFileUpload} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} style={{
                padding: "8px 16px", borderRadius: 8, background: B.surface,
                border: `1px solid ${B.border}`, color: B.textMuted,
                fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>📎 Upload Word Doc</button>
              {uploadStatus === "reading" && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.warning }}>⏳ Reading {uploadName}...</span>
              )}
              {uploadStatus === "done" && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.success }}>✓ {uploadName} loaded</span>
              )}
              {uploadStatus === "error" && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E06847" }}>✗ Could not read file. Try .docx or .txt</span>
              )}
            </div>
            <textarea
              value={resume}
              onChange={e => { setResume(e.target.value); setUploadStatus(""); setUploadName(""); }}
              placeholder="Upload your resume above, or paste it here..."
              style={{
                width: "100%", minHeight: 120, padding: 16, background: B.surface, color: B.text,
                border: `1px solid ${B.border}`, borderRadius: 12,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "vertical", outline: "none",
                lineHeight: 1.6, boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border}
            />
          </div>

          {/* Job Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
            }}>💼 Job Description</label>
            <textarea
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Copy and paste the text of the job posting you're applying to."
              style={{
                width: "100%", minHeight: 120, padding: 16, background: B.surface, color: B.text,
                border: `1px solid ${B.border}`, borderRadius: 12,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "vertical", outline: "none",
                lineHeight: 1.6, boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border}
            />
          </div>

          {/* About Me */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8,
            }}>👤 About Me</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Write a short paragraph about yourself — your personality, what drives you, what makes you unique..."
              style={{
                width: "100%", minHeight: 80, padding: 16, background: B.surface, color: B.text,
                border: `1px solid ${B.border}`, borderRadius: 12,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: "vertical", outline: "none",
                lineHeight: 1.6, boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border}
            />
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate}
            style={{
              padding: "14px 32px", borderRadius: 12, border: "none",
              background: canGenerate
                ? "linear-gradient(135deg, #0A66C2 0%, #E06847 100%)"
                : "#C8D0D9",
              color: "#fff",
              fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600,
              cursor: canGenerate ? "pointer" : "not-allowed",
              boxShadow: canGenerate ? "0 4px 24px rgba(10,102,194,0.2)" : "none",
              transition: "all 0.2s",
            }}
          >
            {generating ? "⏳ Analyzing & Writing..." : "🎯 Generate My Script"}
          </button>
        </div>

        {/* Analysis + Script result */}
        {(analysis || script) && (
          <div style={{
            background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
            padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 32,
          }}>
            {analysis && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{
                    fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.accentLight,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>Role Match Analysis</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800,
                      color: scoreColor(analysis.matchScore),
                    }}>{analysis.matchScore}%</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim }}>match</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)", marginBottom: 16, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3, width: `${analysis.matchScore}%`,
                    background: analysis.matchScore >= 75
                      ? `linear-gradient(90deg, ${B.success}, #046636)`
                      : analysis.matchScore >= 50
                      ? `linear-gradient(90deg, ${B.warning}, #FFEAA7)`
                      : "linear-gradient(90deg, #E06847, #E7A33E)",
                    transition: "width 1s ease",
                  }} />
                </div>
                {analysis.strongMatches?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.success,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>✓ Strong Matches</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {analysis.strongMatches.map((m, i) => (
                        <span key={i} style={{
                          padding: "6px 12px", borderRadius: 8,
                          background: "rgba(5,118,66,0.08)", border: "1px solid rgba(5,118,66,0.15)",
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.success,
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.gapsToBridge?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.warning,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>→ Gaps to Bridge</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {analysis.gapsToBridge.map((g, i) => (
                        <span key={i} style={{
                          padding: "6px 12px", borderRadius: 8,
                          background: "rgba(231,163,62,0.08)", border: "1px solid rgba(231,163,62,0.15)",
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.warning,
                        }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.angleToPlay && (
                  <div style={{ padding: 14, borderRadius: 10, background: B.bg, border: `1px solid ${B.border}` }}>
                    <span style={{
                      fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, color: B.textDim,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>Angle to Play</span>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.text,
                      margin: "6px 0 0", lineHeight: 1.6,
                    }}>{analysis.angleToPlay}</p>
                  </div>
                )}
              </div>
            )}

            {script && (
              <>
                <label style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: B.textDim,
                  textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 10,
                }}>Your Script</label>
                <div style={{
                  padding: "20px 22px", background: B.bg, border: `1px solid ${B.border}`,
                  borderRadius: 14, marginBottom: 20,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.text,
                  lineHeight: 1.8, whiteSpace: "pre-wrap",
                }}>{script}</div>

                {savedId ? (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{
                      padding: "10px 16px", borderRadius: 10,
                      background: "rgba(5,118,66,0.07)", border: "1px solid rgba(5,118,66,0.2)",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.success,
                    }}>✓ Script saved</div>
                    <a href={`/dashboard/record?script_id=${savedId}`} style={{
                      padding: "12px 28px", borderRadius: 12,
                      background: B.gradient, color: "#fff", textDecoration: "none",
                      fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700,
                      boxShadow: `0 4px 16px ${B.accentGlow}`,
                    }}>🎥 Use This Script →</a>
                  </div>
                ) : (
                  <button
                    onClick={saveScript}
                    disabled={saving}
                    style={{
                      padding: "12px 28px", borderRadius: 12, border: "none",
                      background: saving ? "#C8D0D9" : B.gradient,
                      color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      boxShadow: saving ? "none" : `0 4px 16px ${B.accentGlow}`,
                    }}
                  >{saving ? "Saving..." : "💾 Save & Use This Script"}</button>
                )}
              </>
            )}
          </div>
        )}

        {/* History */}
        <div>
          <p style={{
            fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, color: B.textDim,
            textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 16px",
          }}>Script History</p>

          {historyLoading ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid transparent",
                borderTopColor: B.accent, animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{
              padding: "40px 24px", textAlign: "center", background: B.surface,
              border: `1px solid ${B.border}`, borderRadius: 16,
            }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>🎯</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: 0 }}>
                No scripts saved yet. Generate your first one above.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map(item => (
                <div key={item.id} style={{
                  background: B.surface, border: `1px solid ${B.border}`, borderRadius: 16,
                  padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  opacity: deletingId === item.id ? 0.5 : 1, transition: "opacity 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: B.text,
                        margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{(item.job_description || "No job description").slice(0, 90)}{(item.job_description?.length || 0) > 90 ? "…" : ""}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {item.match_score !== null && item.match_score !== undefined && (
                          <span style={{
                            fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700,
                            color: scoreColor(item.match_score),
                          }}>{item.match_score}% match</span>
                        )}
                        {item.duration && (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim }}>
                            {item.duration}s script
                          </span>
                        )}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim }}>
                          {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <a href={`/dashboard/record?script_id=${item.id}`} style={{
                        padding: "7px 14px", borderRadius: 8,
                        background: B.gradient, color: "#fff", textDecoration: "none",
                        fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}>🎥 Use</a>
                      <button
                        disabled={deletingId === item.id}
                        onClick={() => deleteScript(item.id)}
                        style={{
                          padding: "7px 14px", borderRadius: 8,
                          border: "1px solid rgba(220,53,69,0.25)",
                          background: "rgba(220,53,69,0.04)",
                          color: "#DC3545", fontFamily: "'Sora', sans-serif",
                          fontSize: 12, fontWeight: 600,
                          cursor: deletingId === item.id ? "not-allowed" : "pointer",
                        }}
                      >{deletingId === item.id ? "…" : "🗑"}</button>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedScript(expandedScript === item.id ? null : item.id)}
                    style={{
                      padding: "6px 12px", borderRadius: 8,
                      background: B.bg, border: `1px solid ${B.border}`,
                      color: B.textMuted, fontFamily: "'Sora', sans-serif",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >{expandedScript === item.id ? "▲ Hide Script" : "▼ View Script"}</button>
                  {expandedScript === item.id && item.script && (
                    <div style={{
                      marginTop: 12, padding: "16px 18px",
                      background: B.bg, border: `1px solid ${B.border}`,
                      borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13.5, color: B.text, lineHeight: 1.8, whiteSpace: "pre-wrap",
                    }}>{item.script}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
