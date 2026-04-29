"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9", accentGlow: "rgba(10,102,194,0.2)",
  success: "#057642",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

const tools = [
  {
    icon: "🎯",
    title: "Generate Script",
    desc: "Paste your resume and the job description. Get a personalized pitch script in seconds.",
    href: "/",
    cta: "Open Generator",
    primary: false,
  },
  {
    icon: "🎥",
    title: "Record Video",
    desc: "Record a live-verified pitch tied to a specific job. Build your video library.",
    href: "/dashboard/record",
    cta: "Start Recording",
    primary: true,
  },
  {
    icon: "📁",
    title: "My Videos",
    desc: "View, share, and manage all your recorded pitches with view counts.",
    href: "/dashboard/videos",
    cta: "View Library",
    primary: false,
  },
  {
    icon: "📊",
    title: "Analytics",
    desc: "Track total views and daily activity across all your videos.",
    href: "/dashboard/analytics",
    cta: "See Analytics",
    primary: false,
  },
];

function DashboardHeader({ email, onSignOut }) {
  const nav = [
    { label: "Record", href: "/dashboard/record" },
    { label: "My Videos", href: "/dashboard/videos" },
    { label: "Analytics", href: "/dashboard/analytics" },
  ];
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
        {nav.map(({ label, href }) => (
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

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ videoCount: 0, totalViews: 0 });

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_paid")
        .eq("id", session.user.id)
        .single();

      if (!profile?.is_paid) { router.replace("/"); return; }

      setUser(session.user);

      const { data: videos } = await supabase
        .from("videos")
        .select("id, total_views")
        .eq("user_id", session.user.id);

      if (videos) {
        setStats({
          videoCount: videos.length,
          totalViews: videos.reduce((s, v) => s + (v.total_views || 0), 0),
        });
      }

      setLoading(false);
    }
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
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
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader email={user?.email} onSignOut={handleSignOut} />

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800,
            color: B.text, margin: "0 0 6px",
          }}>Welcome back 👋</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.textMuted, margin: 0 }}>
            {user?.email}
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 48, flexWrap: "wrap" }}>
          {[
            { icon: "🎥", label: "Videos Recorded", value: stats.videoCount, color: B.accentLight },
            { icon: "👁️", label: "Total Views", value: stats.totalViews, color: B.success },
          ].map(s => (
            <div key={s.label} style={{
              flex: "1 1 160px", padding: "24px 28px", borderRadius: 18,
              background: B.surface, border: `1px solid ${B.border}`,
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{
                fontFamily: "'Sora', sans-serif", fontSize: 40, fontWeight: 800,
                color: s.color, lineHeight: 1,
              }}>{s.value}</div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: B.textDim, marginTop: 6,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tool cards */}
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, color: B.textDim,
          textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 16px",
        }}>Tools</p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}>
          {tools.map(t => (
            <div key={t.title} style={{
              background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
              padding: "28px 24px", display: "flex", flexDirection: "column",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{t.icon}</div>
              <h3 style={{
                fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700,
                color: B.text, margin: "0 0 8px",
              }}>{t.title}</h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: B.textMuted,
                lineHeight: 1.6, margin: "0 0 20px", flex: 1,
              }}>{t.desc}</p>
              <a href={t.href} style={{
                display: "block", padding: "11px 20px", borderRadius: 12, textAlign: "center",
                background: t.primary ? B.gradient : B.surface,
                color: t.primary ? "#fff" : B.accent,
                border: t.primary ? "none" : `1.5px solid ${B.accent}`,
                fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700,
                textDecoration: "none",
                boxShadow: t.primary ? `0 4px 16px ${B.accentGlow}` : "none",
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >{t.cta}</a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
