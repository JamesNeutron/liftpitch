"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentGlow: "rgba(10,102,194,0.2)",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

const SORA = "'Sora', sans-serif";
const DM = "'DM Sans', sans-serif";

export default function EmployerConsole() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    }
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/employers");
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

      {/* Coming-soon body */}
      <main style={{
        maxWidth: 640, margin: "0 auto",
        padding: "clamp(64px, 12vw, 140px) 24px",
        textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 28px",
          background: "rgba(10,102,194,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none"
            stroke={B.accent} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
          </svg>
        </div>
        <h1 style={{
          fontFamily: SORA, fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800,
          letterSpacing: "-0.02em", margin: "0 0 16px", color: B.text, lineHeight: 1.15,
        }}>
          Welcome — your setup console is coming soon.
        </h1>
        <p style={{
          fontFamily: DM, fontSize: 17, color: B.textMuted, lineHeight: 1.6,
          margin: "0 auto", maxWidth: 480,
        }}>
          Your employer account is all set. We&rsquo;re putting the finishing touches on the
          console where you&rsquo;ll add your video-pitch question and review candidates.
          We&rsquo;ll be in touch as your pilot gets underway.
        </p>
      </main>
    </div>
  );
}
