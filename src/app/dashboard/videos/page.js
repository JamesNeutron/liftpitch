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

function getDailyViewsArray(dailyViews, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push((dailyViews || {})[key] || 0);
  }
  return result;
}

function MiniBarChart({ data }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max((v / max) * 100, 6)}%`,
          borderRadius: 3,
          background: B.gradient,
          opacity: 0.55 + (v / max) * 0.45,
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

function ConfirmModal({ title, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: B.surface, borderRadius: 20, padding: "32px 28px",
        maxWidth: 420, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      }}>
        <h3 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700,
          color: B.text, margin: "0 0 10px",
        }}>Delete this video?</h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted,
          lineHeight: 1.6, margin: "0 0 24px",
        }}>
          <strong style={{ color: B.text }}>{title}</strong> will be permanently deleted from Cloudflare Stream and cannot be recovered.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px 0", borderRadius: 12,
            border: `1.5px solid ${B.border}`, background: B.surface,
            color: B.text, fontFamily: "'Sora', sans-serif", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #DC3545, #C0392B)",
            color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 14,
            fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(220,53,69,0.3)",
          }}>Delete Permanently</button>
        </div>
      </div>
    </div>
  );
}

export default function MyVideos() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, streamUid, title }
  const [deleting, setDeleting] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .single();

      if (profile?.plan !== "pro" && profile?.plan !== "lifetime") { router.replace("/"); return; }

      setUser(session.user);

      const { data } = await supabase
        .from("videos")
        .select("id, video_title, stream_uid, created_at, total_views, daily_views, share_link")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setVideos(data || []);
      setLoading(false);
    }
    init();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const { id, streamUid, title } = confirmDelete;
    setConfirmDelete(null);
    setDeleting(id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/delete-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ videoId: id, streamUid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Delete failed:", err);
        alert("Failed to delete video. Please try again.");
      } else {
        setVideos(v => v.filter(x => x.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete video. Please try again.");
    }

    setDeleting(null);
  };

  const copyLink = (id, link) => {
    navigator.clipboard?.writeText(link || `https://lift-pitch.co/v/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
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

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://lift-pitch.co";

  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <DashboardHeader email={user?.email} onSignOut={handleSignOut} />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 32, flexWrap: "wrap", gap: 12,
        }}>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800,
            color: B.text, margin: 0,
          }}>📁 My Videos</h1>
          <a href="/dashboard/record" style={{
            padding: "12px 24px", borderRadius: 12, background: B.gradient,
            color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700,
            textDecoration: "none", boxShadow: `0 4px 16px ${B.accentGlow}`,
          }}>+ Record New Video</a>
        </div>

        {videos.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: B.surface, borderRadius: 20, border: `1px solid ${B.border}`,
          }}>
            <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4 }}>🎥</div>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700,
              color: B.text, margin: "0 0 10px",
            }}>No videos yet</h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: B.textMuted,
              margin: "0 0 28px", lineHeight: 1.6,
            }}>Record your first verified pitch to get started.</p>
            <a href="/dashboard/record" style={{
              display: "inline-block", padding: "13px 36px", borderRadius: 12,
              background: B.gradient, color: "#fff",
              fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
              textDecoration: "none",
            }}>Record My First Pitch →</a>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {videos.map(video => {
              const dailyData = getDailyViewsArray(video.daily_views, 7);
              const shareUrl = video.share_link || `${appUrl}/v/${video.id}`;
              const title = video.video_title || "Untitled Pitch";
              const isDeleting = deleting === video.id;

              return (
                <div key={video.id} style={{
                  background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20,
                  padding: 24, display: "flex", flexDirection: "column",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.2s",
                }}>
                  {/* Title */}
                  <h3 style={{
                    fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
                    color: B.text, margin: "0 0 6px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }} title={title}>{title}</h3>

                  {/* Date */}
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim, margin: "0 0 16px",
                  }}>
                    {new Date(video.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>

                  {/* Views */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 14 }}>👁️</span>
                    <span style={{
                      fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: B.accentLight,
                    }}>{video.total_views || 0}</span>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: B.textDim,
                    }}>total views</span>
                  </div>

                  {/* 7-day bar chart */}
                  <MiniBarChart data={dailyData} />
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: B.textDim,
                    margin: "4px 0 16px",
                  }}>Last 7 days</p>

                  {/* Share link */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                  }}>
                    <div style={{
                      flex: 1, padding: "9px 12px", background: B.bg, borderRadius: 9,
                      border: `1px solid ${B.border}`, fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12, color: B.accentLight,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{shareUrl}</div>
                    <button onClick={() => copyLink(video.id, shareUrl)} style={{
                      padding: "9px 14px", borderRadius: 9, border: "none",
                      background: copied === video.id
                        ? `linear-gradient(135deg, ${B.success}, #046636)`
                        : B.surface,
                      color: copied === video.id ? "#0A0A0F" : B.text,
                      border: copied === video.id ? "none" : `1px solid ${B.border}`,
                      fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600,
                      cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                    }}>{copied === video.id ? "✓ Copied" : "📋 Copy"}</button>
                  </div>

                  {/* Delete */}
                  <button
                    disabled={isDeleting}
                    onClick={() => setConfirmDelete({ id: video.id, streamUid: video.stream_uid, title })}
                    style={{
                      padding: "9px 0", borderRadius: 10,
                      border: "1px solid rgba(220,53,69,0.25)",
                      background: "rgba(220,53,69,0.04)",
                      color: "#DC3545", fontFamily: "'Sora', sans-serif",
                      fontSize: 12, fontWeight: 600, cursor: isDeleting ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.background = "rgba(220,53,69,0.09)"; e.currentTarget.style.borderColor = "rgba(220,53,69,0.5)"; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,53,69,0.04)"; e.currentTarget.style.borderColor = "rgba(220,53,69,0.25)"; }}
                  >
                    {isDeleting ? "Deleting…" : "🗑 Delete"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
