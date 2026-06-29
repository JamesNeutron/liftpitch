"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642", danger: "#DC3545",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

const SORA = "'Sora', sans-serif";
const DM = "'DM Sans', sans-serif";

// Suggested defaults — editable; question_2 is optional.
const DEFAULT_Q1 = "Tell us a bit about yourself and why this role is exciting to you.";
const ICEBREAKERS = [
  "What's something that always makes your day a little better?",
  "If your coworkers described you in three words, what would they be?",
  "What's a small win you're proud of recently?",
];
const DEFAULT_BRAND_COLOR = "#0A66C2";

// Inline Lucide-style icons — same hand-written SVG convention as /employers.
function Icon({ paths, size = 18, color = B.accent, strokeWidth = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}

export default function EmployerConsole() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Saved roles + their load state.
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Brand settings — stamped onto every role; editable, default to last saved role.
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);

  // Create / edit form.
  const [roleTitle, setRoleTitle] = useState("");
  const [q1, setQ1] = useState(DEFAULT_Q1);
  const [q2, setQ2] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch this employer's roles. RLS scopes rows to auth.uid() = employer_id,
  // so no app-level employer_id filter is needed here.
  const loadRoles = async () => {
    setLoadError("");
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError("We couldn't load your roles. Please refresh to try again.");
      setRolesLoading(false);
      return;
    }
    setRoles(data || []);
    // Seed brand settings from the most recent role so they persist visually
    // across visits (only when the user hasn't started editing them).
    if (data && data.length > 0) {
      setCompanyName(prev => prev || data[0].company_name || "");
      setBrandColor(prev => (prev === DEFAULT_BRAND_COLOR ? (data[0].brand_color || DEFAULT_BRAND_COLOR) : prev));
    }
    setRolesLoading(false);
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/employers/signup"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", session.user.id)
        .single();

      // Only employers belong here; candidates go back to their home.
      if (profile?.account_type !== "employer") { router.replace("/"); return; }

      setUser(session.user);
      setLoading(false);
      loadRoles();
    }
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/employers");
  };

  const resetForm = () => {
    setEditingId(null);
    setRoleTitle("");
    setQ1(DEFAULT_Q1);
    setQ2("");
    setFormError("");
  };

  const startEdit = (role) => {
    setEditingId(role.id);
    setRoleTitle(role.role_title || "");
    setQ1(role.question_1 || "");
    setQ2(role.question_2 || "");
    // Brand settings reflect the role being edited.
    setCompanyName(role.company_name || "");
    setBrandColor(role.brand_color || DEFAULT_BRAND_COLOR);
    setFormError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (saving) return;
    const title = roleTitle.trim();
    const question1 = q1.trim();
    if (!title || !question1) {
      setFormError("A role title and the first question are both required.");
      return;
    }
    setSaving(true);
    setFormError("");

    const payload = {
      role_title: title,
      question_1: question1,
      question_2: q2.trim() || null, // optional — null = a 1-question role
      company_name: companyName.trim() || null,
      brand_color: brandColor || DEFAULT_BRAND_COLOR,
    };

    try {
      if (editingId) {
        // RLS guarantees you can only update your own row; match by id.
        const { error } = await supabase
          .from("roles")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        // employer_id MUST be the logged-in user's id — the RLS WITH CHECK
        // (auth.uid() = employer_id) rejects the insert otherwise.
        const { error } = await supabase
          .from("roles")
          .insert({ ...payload, employer_id: user.id });
        if (error) throw error;
      }
      resetForm();
      await loadRoles();
    } catch (err) {
      setFormError(err.message || "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (typeof window !== "undefined" &&
        !window.confirm(`Delete the role "${role.role_title}"? This can't be undone.`)) {
      return;
    }
    const { error } = await supabase.from("roles").delete().eq("id", role.id);
    if (error) {
      setLoadError("We couldn't delete that role. Please try again.");
      return;
    }
    if (editingId === role.id) resetForm();
    await loadRoles();
  };

  // ---- Shared styles ----
  const inputStyle = {
    width: "100%", padding: "13px 16px", boxSizing: "border-box",
    border: `1px solid ${B.border}`, borderRadius: 10,
    fontFamily: DM, fontSize: 15, color: B.text,
    background: "#FFFFFF", outline: "none", transition: "border-color 0.2s",
  };
  const labelStyle = {
    fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
    textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6,
  };
  const cardStyle = {
    background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
    padding: "clamp(24px, 4vw, 34px)", boxShadow: "0 12px 40px rgba(42,80,128,0.06)",
  };
  const sectionLabel = {
    fontFamily: SORA, fontSize: 12.5, fontWeight: 700, color: B.accent,
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14,
    display: "flex", alignItems: "center", gap: 8,
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

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text, fontFamily: DM }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${B.border}`,
        background: "#FFFFFF", position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/employers" style={{
          fontFamily: SORA, fontSize: 20, fontWeight: 800,
          background: B.gradient, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", textDecoration: "none",
        }}>LiftPitch</a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: DM, fontSize: 13, color: B.textMuted,
            maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{
            padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${B.border}`,
            background: "transparent", color: B.textMuted,
            fontFamily: SORA, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#DC3545"; e.currentTarget.style.color = "#DC3545"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMuted; }}
          >Log Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(32px, 6vw, 56px) 24px" }}>
        {/* Page intro */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: SORA, fontSize: 12.5, fontWeight: 700, color: B.accent,
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12,
          }}>Setup Console</div>
          <h1 style={{
            fontFamily: SORA, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800,
            letterSpacing: "-0.02em", margin: "0 0 12px", color: B.text, lineHeight: 1.15,
          }}>Your roles</h1>
          <p style={{ fontFamily: DM, fontSize: 16, color: B.textMuted, lineHeight: 1.6, margin: 0, maxWidth: 540 }}>
            Set your brand once, then create the roles candidates will pitch for. Each role
            asks one or two short questions — keep it warm and human.
          </p>
        </div>

        {/* 1. BRAND SETTINGS */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={sectionLabel}>
            <Icon size={16} paths={<>
              <circle cx="13.5" cy="6.5" r=".5" fill={B.accent} />
              <circle cx="17.5" cy="10.5" r=".5" fill={B.accent} />
              <circle cx="8.5" cy="7.5" r=".5" fill={B.accent} />
              <circle cx="6.5" cy="12.5" r=".5" fill={B.accent} />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
            </>} />
            Brand settings
          </div>
          <p style={{ fontFamily: DM, fontSize: 14, color: B.textMuted, margin: "-6px 0 20px", lineHeight: 1.55 }}>
            Saved onto each role you create. You can change these any time.
          </p>
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div>
              <label style={labelStyle}>Company name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Inc." style={inputStyle}
                onFocus={e => e.target.style.borderColor = B.accent}
                onBlur={e => e.target.style.borderColor = B.border} />
            </div>
            <div>
              <label style={labelStyle}>Brand color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  aria-label="Brand color"
                  style={{
                    width: 48, height: 46, padding: 2, border: `1px solid ${B.border}`,
                    borderRadius: 10, background: "#fff", cursor: "pointer", flexShrink: 0,
                  }} />
                <input value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  placeholder={DEFAULT_BRAND_COLOR} style={{ ...inputStyle, fontFamily: DM }}
                  onFocus={e => e.target.style.borderColor = B.accent}
                  onBlur={e => e.target.style.borderColor = B.border} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. CREATE / EDIT A ROLE */}
        <div style={{ ...cardStyle, marginBottom: 36, borderColor: editingId ? B.accent : B.border }}>
          <div style={sectionLabel}>
            <Icon size={16} paths={editingId
              ? <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>
              : <><path d="M5 12h14" /><path d="M12 5v14" /></>} />
            {editingId ? "Edit role" : "Create a role"}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Role title <span style={{ color: B.danger }}>*</span></label>
            <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)}
              placeholder="e.g. Customer Support Specialist" style={inputStyle}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Question 1 <span style={{ color: B.danger }}>*</span></label>
            <textarea value={q1} onChange={e => setQ1(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Question 2 <span style={{ color: B.textDim, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>— optional</span></label>
            <textarea value={q2} onChange={e => setQ2(e.target.value)} rows={2}
              placeholder="Leave blank for a one-question role"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = B.accent}
              onBlur={e => e.target.style.borderColor = B.border} />
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: DM, fontSize: 13, color: B.textMuted, marginBottom: 8 }}>
                Suggested icebreakers — tap one to use it:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ICEBREAKERS.map(text => (
                  <button key={text} type="button" onClick={() => setQ2(text)} style={{
                    padding: "8px 14px", borderRadius: 999, border: `1px solid ${B.border}`,
                    background: q2 === text ? "rgba(10,102,194,0.08)" : "#fff",
                    borderColor: q2 === text ? B.accent : B.border,
                    color: q2 === text ? B.accent : B.textMuted,
                    fontFamily: DM, fontSize: 13, cursor: "pointer", textAlign: "left",
                    maxWidth: "100%", transition: "all 0.15s",
                  }}>{text}</button>
                ))}
              </div>
            </div>
          </div>

          {formError && (
            <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.2)" }}>
              <span style={{ fontFamily: DM, fontSize: 13, color: B.danger }}>{formError}</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={handleSave} disabled={saving || !roleTitle.trim() || !q1.trim()} style={{
              padding: "13px 26px", borderRadius: 12, border: "none",
              background: (!saving && roleTitle.trim() && q1.trim()) ? B.gradient : "#C8D0D9",
              color: "#fff", fontFamily: SORA, fontSize: 15, fontWeight: 700,
              cursor: (saving || !roleTitle.trim() || !q1.trim()) ? "not-allowed" : "pointer",
              boxShadow: (!saving && roleTitle.trim() && q1.trim()) ? `0 4px 20px ${B.accentGlow}` : "none",
              transition: "all 0.2s",
            }}>
              {saving ? "Saving…" : editingId ? "Update role" : "Save role"}
            </button>
            {editingId && (
              <button onClick={resetForm} disabled={saving} style={{
                padding: "13px 22px", borderRadius: 12, border: `1.5px solid ${B.border}`,
                background: "transparent", color: B.textMuted,
                fontFamily: SORA, fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
            )}
          </div>
        </div>

        {/* 3. SAVED ROLES LIST */}
        <div>
          <div style={{ ...sectionLabel, color: B.textMuted }}>
            <Icon size={16} color={B.textMuted} paths={<>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" />
            </>} />
            Saved roles
          </div>

          {loadError && (
            <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.2)" }}>
              <span style={{ fontFamily: DM, fontSize: 13, color: B.danger }}>{loadError}</span>
            </div>
          )}

          {rolesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                border: "3px solid transparent", borderTopColor: B.accent,
                animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : roles.length === 0 ? (
            <div style={{
              ...cardStyle, textAlign: "center", padding: "48px 24px",
              borderStyle: "dashed", boxShadow: "none",
            }}>
              <p style={{ fontFamily: DM, fontSize: 15.5, color: B.textMuted, margin: 0 }}>
                No roles yet — create your first above.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {roles.map(role => (
                <div key={role.id} style={{
                  ...cardStyle, padding: "20px 22px",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                        background: role.brand_color || DEFAULT_BRAND_COLOR,
                      }} />
                      <h3 style={{ fontFamily: SORA, fontSize: 17, fontWeight: 700, color: B.text, margin: 0 }}>
                        {role.role_title}
                      </h3>
                      {role.company_name && (
                        <span style={{ fontFamily: DM, fontSize: 13, color: B.textDim }}>
                          · {role.company_name}
                        </span>
                      )}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                      <li style={{ fontFamily: DM, fontSize: 14.5, color: B.textMuted, lineHeight: 1.5 }}>
                        {role.question_1}
                      </li>
                      {role.question_2 && (
                        <li style={{ fontFamily: DM, fontSize: 14.5, color: B.textMuted, lineHeight: 1.5 }}>
                          {role.question_2}
                        </li>
                      )}
                    </ol>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => startEdit(role)} aria-label="Edit role" style={{
                      padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${B.border}`,
                      background: "transparent", color: B.textMuted,
                      fontFamily: SORA, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = B.accent; e.currentTarget.style.color = B.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMuted; }}
                    >Edit</button>
                    <button onClick={() => handleDelete(role)} aria-label="Delete role" style={{
                      padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${B.border}`,
                      background: "transparent", color: B.textMuted,
                      fontFamily: SORA, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = B.danger; e.currentTarget.style.color = B.danger; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.color = B.textMuted; }}
                    >Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
