"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { TERMS_VERSION } from "../../../lib/consent";

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
  const [companyName, setCompanyName] = useState(""); // org name (signup only)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false); // required terms acceptance (signup only)
  // An already-authenticated user with no org (e.g. signUp succeeded but the
  // create_org that follows failed). We must NOT re-run signUp for them — it
  // rejects the existing email and would permanently lock them out of
  // provisioning. Instead we reuse the live session and only run create_org.
  const [sessionUser, setSessionUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // On mount, detect an existing session. If they already have an org, they're
  // fully set up → send them to the console. If they're logged in WITHOUT an
  // org, drop into "finish setup" mode: reuse their session, prefill/lock the
  // email, and don't require a password (signUp is skipped). A fresh visitor
  // (no session) sees the normal form.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("org_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!active) return;
        if (membership) { router.replace("/employers/console"); return; }
        setSessionUser(session.user);
        setEmail(session.user.email || "");
        setMode("signup");
      }
      setCheckingSession(false);
    })();
    return () => { active = false; };
  }, [router]);

  // Signup needs a company name (it seeds the organization) and the required
  // terms box checked. Email + password are only needed to CREATE the account,
  // so a recovery user (already authenticated, sessionUser set) skips them.
  // Login needs email + password only.
  const canSubmit = !loading && (
    mode === "login"
      ? (!!email && !!password)
      : (agreed && !!companyName.trim() && (!!sessionUser || (!!email && !!password)))
  );

  // "Finish setup" mode: authenticated already, just missing an org. The account
  // exists, so we hide the password field and lock the email — only the company
  // name + terms remain.
  const recovering = mode === "signup" && !!sessionUser;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        // Reuse an existing session instead of calling signUp again. This is the
        // recovery path: if a prior submit created the account (signUp succeeded)
        // but the create_org after it failed, signUp here would reject the now-
        // existing email and strand the user with an account but no org and no
        // way to retry. We re-check the LIVE session (not just mount state) so a
        // retry within the same submit sequence also skips signUp.
        let authUser;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          authUser = session.user;
        } else {
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
          // handle_new_user trigger).
          authUser = data?.user;
        }

        const userId = authUser?.id;
        if (!userId) {
          throw new Error("We couldn't establish your account session. Please try again.");
        }
        // From here on we hold a real session, so any failure below leaves a
        // resumable account, not a dead end — reflect that in the UI (email
        // prefilled/locked, password no longer required).
        setSessionUser(authUser);

        // Tag as employer AND record acceptance of the Employer Agreement +
        // Privacy Policy in the same required write. employer_terms_accepted_at
        // is stamped server-side by a DB trigger; the client only supplies the
        // version. Idempotent, so it's safe to re-run on a recovery submit.
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ account_type: "employer", employer_terms_version: TERMS_VERSION })
          .eq("id", userId);
        if (upErr) throw upErr;

        // Provision the organization. Brand now lives ONLY on organizations;
        // create_org (SECURITY DEFINER) inserts the org and the caller's
        // membership. If the account already has an org (e.g. a retried submit),
        // create_org raises 45001/ALREADY_IN_ORG; treat that as already-done and
        // proceed. Any other failure throws — but the account persists and this
        // same submit can simply be retried (it will now skip signUp).
        const { error: orgErr } = await supabase.rpc("create_org", {
          org_name: companyName.trim(),
        });
        if (orgErr && orgErr.hint !== "ALREADY_IN_ORG") {
          throw new Error(
            "Your account is ready, but we couldn't finish setting up your " +
            "workspace. Please try again — you won't lose your account or have " +
            "to sign up over."
          );
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

  // Probing the session on mount — hold the form back so we don't flash the
  // wrong copy (or the signup form to someone we're about to redirect).
  if (checkingSession) {
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
                {recovering ? "Almost there." : mode === "signup" ? "Start your free pilot." : "Welcome back."}
              </h1>
              <p style={{
                fontFamily: DM, fontSize: 16.5, color: B.textMuted, lineHeight: 1.6,
                margin: "0 0 28px", maxWidth: 420,
              }}>
                {recovering
                  ? "Your account is ready — just name your company to finish setting up your workspace."
                  : mode === "signup"
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
                {recovering ? "Finish setting up your workspace" : mode === "signup" ? "Create employer account" : "Employer sign in"}
              </h2>
              <p style={{ fontFamily: DM, fontSize: 14, color: B.textMuted, margin: "0 0 24px" }}>
                {recovering ? "You're signed in — just name your company to continue." : mode === "signup" ? "No card required during the pilot." : "Sign in to continue."}
              </p>

              {mode === "signup" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
                    textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                    Company name
                  </label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="Acme Inc." style={inputStyle}
                    onFocus={e => e.target.style.borderColor = B.accent}
                    onBlur={e => e.target.style.borderColor = B.border}
                  />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: SORA, fontSize: 12, fontWeight: 600, color: B.textDim,
                  textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                  Work email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" disabled={recovering}
                  style={recovering
                    ? { ...inputStyle, background: B.bg, color: B.textMuted, cursor: "not-allowed" }
                    : inputStyle}
                  onFocus={e => { if (!recovering) e.target.style.borderColor = B.accent; }}
                  onBlur={e => e.target.style.borderColor = B.border}
                />
              </div>

              {!recovering && (
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
              )}

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                  background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.2)" }}>
                  <span style={{ fontFamily: DM, fontSize: 13, color: B.danger }}>{error}</span>
                </div>
              )}

              {mode === "signup" && (
                <label style={{
                  display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20,
                  cursor: "pointer", fontFamily: DM, fontSize: 13.5, color: B.textMuted, lineHeight: 1.5,
                }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ width: 17, height: 17, marginTop: 1, flexShrink: 0, accentColor: B.accent, cursor: "pointer" }}
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/legal#employer" target="_blank" rel="noopener noreferrer"
                      style={{ color: B.accent, fontWeight: 600, textDecoration: "none" }}>
                      Employer Agreement
                    </a>{" "}and{" "}
                    <a href="/legal#privacy" target="_blank" rel="noopener noreferrer"
                      style={{ color: B.accent, fontWeight: 600, textDecoration: "none" }}>
                      Privacy Policy
                    </a>.
                  </span>
                </label>
              )}

              <button onClick={handleSubmit} disabled={!canSubmit} style={{
                width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
                background: canSubmit ? B.gradient : "#C8D0D9",
                color: "#fff", fontFamily: SORA, fontSize: 16, fontWeight: 700,
                cursor: canSubmit ? "pointer" : "not-allowed",
                boxShadow: canSubmit ? `0 4px 20px ${B.accentGlow}` : "none",
                transition: "all 0.2s",
              }}>
                {loading ? "Please wait…" : recovering ? "Finish setup" : mode === "signup" ? "Start Free Pilot" : "Sign In"}
              </button>

              {/* Account-switch toggle is meaningless in recovery mode (already
                  authenticated) — hide it and offer a sign-out escape instead. */}
              {recovering ? (
                <p style={{ textAlign: "center", marginTop: 18, fontFamily: DM, fontSize: 14, color: B.textMuted }}>
                  Not you?{" "}
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} style={{
                    background: "none", border: "none", color: B.accent,
                    fontFamily: DM, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0,
                  }}>
                    Sign out
                  </button>
                </p>
              ) : (
                <p style={{ textAlign: "center", marginTop: 18, fontFamily: DM, fontSize: 14, color: B.textMuted }}>
                  {mode === "signup" ? "Already have an account? " : "Need an employer account? "}
                  <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }} style={{
                    background: "none", border: "none", color: B.accent,
                    fontFamily: DM, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0,
                  }}>
                    {mode === "signup" ? "Sign in" : "Start free"}
                  </button>
                </p>
              )}
            </div>
          </div>
      </main>
    </div>
  );
}
