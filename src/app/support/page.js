"use client";

import { useState } from "react";
import Link from "next/link";

const C = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9",
  text: "#1A1A2E", muted: "#56687A", dim: "#8FA4B8",
  success: "#057642",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

function FaqItem({ question, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: C.surface, border: `1px solid ${open ? C.accent : C.border}`,
      borderRadius: 14, marginBottom: 10, overflow: "hidden", transition: "border-color 0.2s",
    }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = C.accentLight; }}
      onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = C.border; }}
    >
      <div onClick={() => setOpen(o => !o)} style={{
        padding: "18px 20px", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "space-between", gap: 12, userSelect: "none",
      }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: C.text }}>
          {question}
        </span>
        <span style={{
          fontSize: 18, color: C.dim, transition: "transform 0.25s", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>&#9662;</span>
      </div>
      {open && (
        <div style={{
          padding: "0 20px 18px", fontSize: 14, color: C.muted, lineHeight: 1.75,
          borderTop: `1px solid ${C.border}`, paddingTop: 14,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function StepList({ children }) {
  return (
    <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8, margin: "10px 0 0" }}>
      {children}
    </ol>
  );
}

function Step({ num, children }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: C.muted }}>
      <span style={{
        minWidth: 22, height: 22, borderRadius: "50%", background: C.gradient,
        color: "#fff", fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0,
      }}>{num}</span>
      <span>{children}</span>
    </li>
  );
}

function BrowserGrid({ children }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 12, margin: "12px 0",
    }}>{children}</div>
  );
}

function BrowserCard({ name, children }) {
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
        paddingBottom: 14, borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.7 }}>

      {/* Header */}
      <header style={{
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`, padding: "18px 40px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800,
          background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textDecoration: "none",
        }}>LiftPitch</Link>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, color: C.muted }}>
          Need help?{" "}
          <a href="mailto:support@lift-pitch.co" style={{ color: C.accent, textDecoration: "none", fontWeight: 600 }}>
            support@lift-pitch.co
          </a>
        </div>
      </header>

      {/* Hero */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "60px 40px", textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: C.accentLight, marginBottom: 12,
        }}>Help Center</div>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800,
          color: C.text, marginBottom: 12,
        }}>LiftPitch Help</h1>
        <p style={{ fontSize: 16, color: C.muted, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
          Need help? Email{" "}
          <a href="mailto:support@lift-pitch.co" style={{ color: C.accent, textDecoration: "none", fontWeight: 600 }}>
            support@lift-pitch.co
          </a>
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* For Employers */}
        <Section icon="💼" title="For Employers">
          <FaqItem question="What is LiftPitch?">
            LiftPitch adds short, live-verified video introductions to your existing hiring workflow. You create
            a role, get a recording link, and add it to your job posting or ATS. Applicants record a brief video
            intro when they apply — so you can meet the real person before you decide who to screen. LiftPitch
            never scores, ranks, or evaluates candidates with AI. Every video is reviewed by you and your team.
          </FaqItem>

          <FaqItem question="How do I get started?">
            Create an employer account, set your brand colors, and create your first role with one or two short
            questions. You&#39;ll get a recording link to add to your job postings. Setup takes just a few minutes.
          </FaqItem>

          <FaqItem question="Where do I put the recording link?">
            Add it to your job application as a question or instruction — for example, in your ATS application
            form or the job posting itself. Every applicant sees it when they apply.
          </FaqItem>

          <FaqItem question="How does billing work?">
            LiftPitch is free during your pilot — no credit card required. Paid plans are billed per active role.
            You can cancel anytime by emailing{" "}
            <a href="mailto:support@lift-pitch.co" style={{ color: C.accent }}>support@lift-pitch.co</a>; access
            continues through the end of your billing period.
          </FaqItem>

          <FaqItem question="Do candidates need an account or have to pay?">
            No. Candidates record for free, without creating an account. They only need the link you provide.
          </FaqItem>
        </Section>

        {/* For Candidates Recording a Pitch */}
        <Section icon="🎥" title="For Candidates Recording a Pitch">
          <FaqItem question="My camera screen is black.">
            This is almost always one of these:
            <StepList>
              <Step num={1}><strong>Update your browser.</strong> An outdated version of Chrome is the most common cause. Go to Chrome menu → Help → About Google Chrome to check for updates.</Step>
              <Step num={2}><strong>Check camera permissions.</strong> Look for a camera icon in the address bar and click &#34;Allow.&#34;</Step>
              <Step num={3}><strong>Close other apps using your camera.</strong> Zoom, FaceTime, or other video apps may have your camera locked.</Step>
              <Step num={4}><strong>Try a different browser.</strong> Chrome and Edge work best; Safari on Mac also works well.</Step>
              <Step num={5}><strong>Restart your browser.</strong> Close it completely and reopen the page.</Step>
            </StepList>
          </FaqItem>

          <FaqItem question="Enabling camera access">
            <BrowserGrid>
              <BrowserCard name="🌐 Chrome">Click the camera icon in the address bar → &#34;Always allow&#34; → refresh.</BrowserCard>
              <BrowserCard name="🧭 Safari">Safari menu → Settings for This Website → Camera &amp; Microphone → &#34;Allow.&#34;</BrowserCard>
              <BrowserCard name="🦊 Firefox">Click the camera icon in the address bar → &#34;Allow&#34; for camera and microphone.</BrowserCard>
              <BrowserCard name="📱 Mobile">Phone Settings → Privacy → Camera → enable access for your browser.</BrowserCard>
            </BrowserGrid>
          </FaqItem>

          <FaqItem question="Can I upload a pre-recorded video?">
            No, and this is intentional. LiftPitch only allows live, in-browser recording. Every video gets a
            &#34;Live Verified&#34; badge that tells the employer it was recorded in real time. Pre-recorded or
            AI-generated videos are not accepted.
          </FaqItem>

          <FaqItem question="How long is my video kept?">
            Videos are retained for up to <strong>12 months</strong> from the recording date. You can request
            earlier deletion anytime by emailing{" "}
            <a href="mailto:privacy@lift-pitch.co" style={{ color: C.accent }}>privacy@lift-pitch.co</a>.
          </FaqItem>
        </Section>

        {/* Contact Card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: 36, textAlign: "center", marginTop: 48,
        }}>
          <h2 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700,
            color: C.text, marginBottom: 10,
          }}>Still need help?</h2>
          <p style={{
            fontSize: 15, color: C.muted, marginBottom: 24, lineHeight: 1.7,
            maxWidth: 420, marginLeft: "auto", marginRight: "auto",
          }}>Our support team is here for you. Send us an email and we&#39;ll get back to you as soon as possible.</p>
          <a href="mailto:support@lift-pitch.co" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 32px", background: C.gradient, color: "#fff",
            borderRadius: 12, fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 4px 20px rgba(10,102,194,0.2)",
            transition: "transform 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            ✉️ Email Support
          </a>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 14 }}>
            support@lift-pitch.co · Pangea Square LLC · Michigan, United States
          </div>
        </div>

      </div>
    </div>
  );
}
