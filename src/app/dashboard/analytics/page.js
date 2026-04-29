"use client";

import { useEffect, useState } from "react";
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

function getDateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function getDailyViewsArray(dailyViews, days) {
  return Array.from({ length: days }, (_, i) => {
    const key = getDateKey(days - 1 - i);
    return (dailyViews || {})[key] || 0;
  });
}

function BarChart({ data, height = 80, color = B.gradient }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max((v / max) * 100, 3)}%`,
          borderRadius: "3px 3px 0 0",
          background: color,
          opacity: 0.5 + (v / max) * 0.5,
          transition: "height 0.3s",
        }} />
      ))}
    </div>
  );
}

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

export default function Analytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

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

      const { data } = await supabase
        .from("videos")
        .select("id, video_title, created_at, total_views, daily_views")
        .eq("user_id", session.user.id)
        .order("total_views", { ascending: false });

      setVideos(data || []);
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

  const totalViews = videos.reduce((s, v) => s + (v.total_views || 0), 0);
  const totalVideos = videos.length;

  // Aggregate daily views across all videos for the last 30 days
  const combined30 = Array.from({ length: 30 }, (_, i) => {
    const key = getDateKey(29 - i);
    return videos.reduce((s, v) => s + ((v.daily_views || {})[key] || 0), 0);
  });

  const dateLabels30 = [0, 6, 13, 20, 29].map(i => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { i, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  });

  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader email={user?.email} onSignOut={handleSignOut} />

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800,
          color: B.text, margin: "0 0 32px",
        }}>📊 Analytics</h1>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { icon: "👁️", label: "Total Views", value: totalViews, color: B.accentLight },
            { icon: "🎥", label: "Videos Recorded", value: totalVideos, color: B.success },
          ].map(s => (
            <div key={s.label} style={{
              flex: "1 1 160px", padding: "24px 28px", borderRadius: 18,
              background: B.surface, border: `1px solid ${B.border}`,
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
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

        {totalVideos === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: B.surface, borderRadius: 20, border: `1px solid ${B.border}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📊</div>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700,
              color: B.text, margin: "0 0 10px",
            }}>No data yet</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, margin: "0 0 24px" }}>
              Record a video pitch to start seeing analytics.
            </p>
            <a href="/dashboard/record" style={{
              display: "inline-block", padding: "13px 32px", borderRadius: 12,
              background: B.gradient, color: "#fff",
              fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>Record My First Pitch →</a>
          </div>
        ) : (
          <>
            {/* 30-day combined chart */}
            <div style={{
              background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
              padding: 28, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <h2 style={{
                fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
                color: B.text, margin: "0 0 20px",
              }}>Total daily views — last 30 days</h2>
              <BarChart data={combined30} height={100} />
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 8,
                fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: B.textDim,
              }}>
                {dateLabels30.map(({ i, label }) => (
                  <span key={i}>{label}</span>
                ))}
              </div>
            </div>

            {/* Per-video breakdown */}
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
              color: B.text, margin: "0 0 16px",
            }}>Per-video breakdown</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {videos.map(video => {
                const daily7 = getDailyViewsArray(video.daily_views, 7);
                const title = video.video_title || "Untitled Pitch";
                return (
                  <div key={video.id} style={{
                    background: B.surface, border: `1px solid ${B.border}`, borderRadius: 16,
                    padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16,
                    }}>
                      <div>
                        <span style={{
                          fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: B.text,
                        }}>{title}</span>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: B.textDim, marginLeft: 12,
                        }}>
                          {new Date(video.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "4px 12px", borderRadius: 8,
                        background: "rgba(10,102,194,0.07)", border: "1px solid rgba(10,102,194,0.15)",
                      }}>
                        <span style={{ fontSize: 12 }}>👁️</span>
                        <span style={{
                          fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 800, color: B.accentLight,
                        }}>{video.total_views || 0}</span>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: B.textDim,
                        }}>views</span>
                      </div>
                    </div>

                    <BarChart data={daily7} height={48} />
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: B.textDim, margin: "4px 0 0",
                    }}>Last 7 days</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
