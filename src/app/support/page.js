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

function HighlightBox({ children }) {
  return (
    <div style={{
      padding: "14px 18px", background: "rgba(10,102,194,0.05)",
      border: "1px solid rgba(10,102,194,0.15)", borderRadius: 10,
      margin: "12px 0", fontSize: 14, color: C.muted, lineHeight: 1.7,
    }}>{children}</div>
  );
}

function WarningBox({ children }) {
  return (
    <div style={{
      padding: "14px 18px", background: "rgba(231,163,62,0.07)",
      border: "1px solid rgba(231,163,62,0.25)", borderRadius: 10,
      margin: "12px 0", fontSize: 14, color: "#7A5C1E", lineHeight: 1.7,
    }}>{children}</div>
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
        }}>How can we help?</h1>
        <p style={{ fontSize: 16, color: C.muted, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
          Find answers to common questions about recording, scripts, your account, and more.
          Can&#39;t find what you&#39;re looking for? Scroll to the bottom to contact us.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Getting Started */}
        <Section icon="🚀" title="Getting Started">
          <FaqItem question="How does LiftPitch work?">
            LiftPitch lets you record a short, live-verified video pitch and share it via a link on your resume. Here&#39;s the flow:
            <StepList>
              <Step num={1}>Paste your resume and a job description to get a match score and personalized script.</Step>
              <Step num={2}>Use the Strengthen Your Resume tool to address any gaps identified.</Step>
              <Step num={3}>Record your live video pitch directly in your browser — no uploads allowed.</Step>
              <Step num={4}>Copy your verified link and add it to your resume.</Step>
            </StepList>
          </FaqItem>

          <FaqItem question="What does the free tier include?">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, margin: "12px 0" }}>
              <thead>
                <tr>
                  {["Feature", "Free", "Pro ($8/mo or $99 lifetime)"].map(h => (
                    <th key={h} style={{
                      background: C.bg, padding: "10px 14px", textAlign: "left",
                      fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      color: C.dim, borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Script generation", "✓ 1 use", "✓ Unlimited"],
                  ["Resume strengthening", "✓ 1 use", "✓ Unlimited"],
                  ["Video recording", "✓ 1 video", "✓ Unlimited"],
                  ["Shareable link", "✓ With watermark", "✓ No watermark"],
                  ["View analytics", "✗", "✓ Full analytics"],
                ].map(([feature, free, pro], i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px 14px", color: C.muted, borderBottom: i < 4 ? `1px solid ${C.border}` : "none", verticalAlign: "top" }}>{feature}</td>
                    <td style={{ padding: "10px 14px", borderBottom: i < 4 ? `1px solid ${C.border}` : "none", verticalAlign: "top", color: free === "✗" ? C.dim : C.success, fontWeight: 700 }}>{free}</td>
                    <td style={{ padding: "10px 14px", borderBottom: i < 4 ? `1px solid ${C.border}` : "none", verticalAlign: "top", color: C.success, fontWeight: 700 }}>{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FaqItem>

          <FaqItem question="Do I need to create an account?">
            Yes — you&#39;ll be prompted to create a free account when you click &#34;Generate My Script.&#34;
            This lets us save your script, match analysis, and video so you can access them later.
            Signing up is free and only takes a moment.
          </FaqItem>
        </Section>

        {/* Video Recording Issues */}
        <Section icon="🎥" title="Video Recording Issues">
          <FaqItem question="My camera shows a black screen — what do I do?">
            A black camera screen is almost always caused by one of these:
            <StepList>
              <Step num={1}><strong>Update your browser.</strong> An outdated version of Chrome is the most common cause. Go to Chrome menu → Help → About Google Chrome to check for updates.</Step>
              <Step num={2}><strong>Check camera permissions.</strong> Your browser needs permission to access your camera. Look for a camera icon in the address bar and click &#34;Allow.&#34;</Step>
              <Step num={3}><strong>Close other apps using your camera.</strong> Zoom, FaceTime, or other video apps may have your camera locked. Close them and try again.</Step>
              <Step num={4}><strong>Try a different browser.</strong> Chrome and Edge work best. Safari on Mac also works well.</Step>
              <Step num={5}><strong>Restart your browser.</strong> Close it completely and reopen the page.</Step>
            </StepList>
            <HighlightBox>
              <strong>Note:</strong> LiftPitch requires a physical camera on your device. Virtual cameras or screen-sharing software may not work.
            </HighlightBox>
          </FaqItem>

          <FaqItem question="How do I allow camera and microphone access?">
            <BrowserGrid>
              <BrowserCard name="🌐 Chrome">Click the camera icon in the address bar → select &#34;Always allow&#34; → refresh the page.</BrowserCard>
              <BrowserCard name="🧭 Safari">Safari menu → Settings for This Website → Camera &amp; Microphone → set to &#34;Allow.&#34;</BrowserCard>
              <BrowserCard name="🦊 Firefox">Click the camera icon in the address bar → select &#34;Allow&#34; for both camera and microphone.</BrowserCard>
              <BrowserCard name="📱 Mobile">Go to your phone&#39;s Settings → Privacy → Camera → enable access for your browser app.</BrowserCard>
            </BrowserGrid>
          </FaqItem>

          <FaqItem question="Can I upload a pre-recorded video?">
            No — and this is intentional. LiftPitch only allows live, in-browser recordings.
            This is our core trust and verification feature: every video gets a &#34;Live Verified&#34; badge
            that tells recruiters the pitch was recorded in real time by a real person. Pre-recorded or
            AI-generated videos are not accepted.
          </FaqItem>
        </Section>

        {/* Script Generator Issues */}
        <Section icon="🎯" title="Script Generator Issues">
          <FaqItem question="The page is spinning and won't load — how do I fix it?">
            This is usually caused by your browser serving a cached (saved) old version of the site. Here&#39;s how to fix it:
            <BrowserGrid>
              <BrowserCard name="🌐 Chrome">
                Press <strong>Cmd+Shift+R</strong> (Mac) or <strong>Ctrl+Shift+R</strong> (Windows) for a hard reload.
                Or open an Incognito window (Cmd+Shift+N) and try again.
              </BrowserCard>
              <BrowserCard name="🧭 Safari">
                Hold <strong>Shift</strong> and click the Reload button. Or go to Develop menu → Empty Caches, then reload.
              </BrowserCard>
              <BrowserCard name="📱 Mobile">
                Close the browser app completely, reopen it, and navigate back to lift-pitch.co.
              </BrowserCard>
            </BrowserGrid>
            <WarningBox>
              <strong>Still spinning after 10 seconds?</strong> Try opening LiftPitch in a private or incognito window.
              If it loads there, clearing your browser cache will fix it in your regular window.
              Contact us at{" "}
              <a href="mailto:support@lift-pitch.co" style={{ color: "#B5780F", fontWeight: 600 }}>support@lift-pitch.co</a>
              {" "}if the issue continues.
            </WarningBox>
          </FaqItem>

          <FaqItem question="My resume looks garbled after pasting — what happened?">
            Copying and pasting from a PDF can distort the formatting — words may merge together or lines may be out of order. For best results:
            <StepList>
              <Step num={1}>Use the <strong>Upload Word Doc</strong> button to upload your resume as a .docx file.</Step>
              <Step num={2}>Or copy from a plain text version of your resume if you have one.</Step>
              <Step num={3}>If you only have a PDF, try pasting it and then manually cleaning up any obvious formatting errors before generating.</Step>
            </StepList>
          </FaqItem>

          <FaqItem question="Do I have to use the script?">
            Not at all! The script is a starting point, not a requirement. Many users find it most useful to
            review the <strong>match score and gap analysis</strong> to understand what to highlight in their pitch,
            and then speak naturally in their own words. The script is there if you need help getting started —
            but recruiters respond best to authentic, conversational delivery. Use it however feels right for you.
          </FaqItem>
        </Section>

        {/* Sharing Your Pitch */}
        <Section icon="🔗" title="Sharing Your Pitch">
          <FaqItem question="How do I add my pitch link to my resume?">
            After recording, copy your verified link from the Record page. Add it to your resume near your
            name and contact information — for example:
            <HighlightBox><strong>Video Pitch:</strong> lift-pitch.co/v/your-link-here</HighlightBox>
            You can also add it as a hyperlink on your name or a &#34;View My Pitch&#34; line. Recruiters who
            click the link will see your video with a Live Verified badge.
          </FaqItem>

          <FaqItem question="What do recruiters see when they click my link?">
            Recruiters see your video with a Live Verified badge confirming it was recorded live in real time.
            Free tier videos include a LiftPitch watermark. Pro users get a clean, watermark-free experience.
            Recruiters do not need a LiftPitch account to watch your video.
          </FaqItem>

          <FaqItem question="How long does my video stay active?">
            Videos are stored for <strong>12 months</strong> from the recording date. After that the link will expire.
            You can request early deletion at any time by emailing{" "}
            <a href="mailto:support@lift-pitch.co" style={{ color: C.accent }}>support@lift-pitch.co</a>.
            We recommend re-recording your pitch periodically to keep it current.
          </FaqItem>
        </Section>

        {/* Account & Billing */}
        <Section icon="💳" title="Account & Billing">
          <FaqItem question="How do I cancel my Pro subscription?">
            You can cancel your monthly subscription at any time. Your Pro access continues until the end of
            your current billing period. To cancel, email{" "}
            <a href="mailto:support@lift-pitch.co" style={{ color: C.accent }}>support@lift-pitch.co</a>
            {" "}with the subject &#34;Cancel Subscription&#34; and we&#39;ll process it within 1 business day.
          </FaqItem>

          <FaqItem question="What is your refund policy?">
            Monthly plans can be cancelled anytime with no refund for the current period. Lifetime passes are
            non-refundable after 14 days. If you experience a technical issue within 14 days of purchase, contact
            us at{" "}
            <a href="mailto:support@lift-pitch.co" style={{ color: C.accent }}>support@lift-pitch.co</a>
            {" "}and we&#39;ll work to resolve it or provide a discretionary refund.
          </FaqItem>

          <FaqItem question="How do I delete my account and data?">
            Email{" "}
            <a href="mailto:privacy@lift-pitch.co" style={{ color: C.accent }}>privacy@lift-pitch.co</a>
            {" "}with the subject &#34;Delete My Account.&#34; We will delete your account, videos, scripts,
            and personal data within 30 days. Note that payment records are retained for 7 years as required
            by U.S. tax law.
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
