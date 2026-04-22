"use client";

import { useState } from "react";

const B = {
  bg: "#F5F7FA", surface: "#FFFFFF", border: "#E2E8F0",
  accent: "#0A66C2", accentLight: "#378FE9",
  text: "#1A1A2E", textMuted: "#56687A", textDim: "#8FA4B8",
  success: "#057642",
  gradient: "linear-gradient(135deg, #0A66C2 0%, #378FE9 50%, #70B5F9 100%)",
};

function SectionTitle({ number, title, badge }) {
  return (
    <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${B.border}` }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.accentLight, marginBottom: 6 }}>
        Section {String(number).padStart(2, "0")}
      </div>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: B.text, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {title}
        {badge && (
          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: "rgba(5,118,66,0.1)", border: "1px solid rgba(5,118,66,0.2)", fontSize: 10, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: B.success, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function P({ children, style = {} }) {
  return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: B.textMuted, lineHeight: 1.75, marginBottom: 12, ...style }}>{children}</p>;
}

function UL({ items }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ paddingLeft: 20, position: "relative", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: B.textMuted, lineHeight: 1.6 }}>
          <span style={{ position: "absolute", left: 0, color: B.textDim }}>—</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function HL({ children }) {
  return (
    <div style={{ padding: "16px 20px", background: "rgba(10,102,194,0.04)", border: "1px solid rgba(10,102,194,0.12)", borderRadius: 10, margin: "16px 0", fontSize: 14, color: B.textMuted, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </div>
  );
}

function ContactBox({ lines }) {
  return (
    <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, rgba(10,102,194,0.06), rgba(55,143,233,0.03))", border: "1px solid rgba(10,102,194,0.15)", borderRadius: 14, marginTop: 16 }}>
      {lines.map((l, i) => <p key={i} style={{ margin: "4px 0", fontSize: 14, color: B.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{l}</p>)}
    </div>
  );
}

const A = ({ href, children }) => (
  <a href={href} style={{ color: B.accent, textDecoration: "none" }}>{children}</a>
);

function TermsOfService() {
  const tocItems = [
    [1, "Acceptance of Terms"], [2, "Description of Service"], [3, "Eligibility"],
    [4, "Account Registration"], [5, "Subscription Plans & Payments"],
    [6, "Video Recording & Content License"], [7, "Video Deletion & Link Expiration"],
    [8, "AI-Generated Scripts"], [9, "Intellectual Property"], [10, "DMCA & Copyright"],
    [11, "Prohibited Conduct"], [12, "Third-Party Services"], [13, "Disclaimers"],
    [14, "Limitation of Liability"], [15, "Indemnification"],
    [16, "Dispute Resolution & Arbitration"], [17, "Termination"], [18, "Governing Law"],
    [19, "General Provisions"], [20, "Changes to These Terms"], [21, "Contact"],
  ];

  return (
    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "36px 40px 28px", borderBottom: `1px solid ${B.border}`, background: "linear-gradient(135deg, rgba(10,102,194,0.04), rgba(55,143,233,0.02))" }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.accentLight, marginBottom: 10 }}>Pangea Square LLC · Legal · Version 2</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text, marginBottom: 12 }}>Terms of Service</div>
        <div style={{ fontSize: 13, color: B.textDim, display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "'DM Sans', sans-serif" }}>
          <span>📅 Effective Date: [INSERT DATE]</span><span>📍 Michigan, United States</span>
        </div>
      </div>

      <div style={{ margin: "28px 40px 0", padding: "16px 20px", background: "rgba(231,163,62,0.08)", border: "1px solid rgba(231,163,62,0.25)", borderRadius: 12, fontSize: 13, color: "#7A5C1E", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
        <strong style={{ color: "#B5780F" }}>⚠️ Draft — Not Legal Advice.</strong> Have a licensed Michigan attorney review and finalize before publishing. Fill in every [bracketed field].
      </div>

      <div style={{ margin: "28px 40px 0", padding: "20px 24px", background: B.bg, border: `1px solid ${B.border}`, borderRadius: 14 }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: B.textDim, marginBottom: 12 }}>Table of Contents</div>
        <ol style={{ listStyle: "decimal", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
          {tocItems.map(([n, label]) => (
            <li key={n}><a href={`#t${n}`} style={{ fontSize: 13, color: B.accent, textDecoration: "none", fontWeight: 500 }}>{label}</a></li>
          ))}
        </ol>
      </div>

      <div style={{ padding: "36px 40px" }}>
        <div id="t1" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={1} title="Acceptance of Terms" />
          <P>By accessing or using LiftPitch ("the Service" or "LiftPitch"), a product of Pangea Square LLC, a Michigan limited liability company ("Pangea Square," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms") and our <A href="#privacy">Privacy Policy</A>, which is incorporated herein by reference. If you do not agree, do not use the Service.</P>
          <P>These Terms form a legally binding agreement between you and Pangea Square LLC. You must affirmatively accept these Terms during account creation via a checkbox acknowledgment. Continued use after any modifications constitutes acceptance of the revised Terms.</P>
        </div>

        <div id="t2" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={2} title="Description of Service" />
          <P>LiftPitch provides a web-based platform that allows users to:</P>
          <UL items={[
            "Record short, live-verified video pitches directly in-browser using their device camera and microphone",
            "Generate AI-assisted video scripts tailored to specific job descriptions using resume and personal information provided by the user",
            "Receive a shareable link to their recorded video for inclusion on resumes or job applications",
            "Access view analytics and career tips (paid tier)",
          ]} />
          <HL><strong>Live-Only Recording Policy:</strong> LiftPitch does not accept pre-recorded video uploads. All videos are recorded live in real-time through your browser — a core feature of our verification system designed to ensure authenticity for employers and recruiters.</HL>
        </div>

        <div id="t3" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={3} title="Eligibility" />
          <P>You must be at least 18 years of age to use LiftPitch. By using the Service you represent that you are 18 or older and have legal capacity to enter a binding agreement. LiftPitch is currently available to users located in the United States.</P>
        </div>

        <div id="t4" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={4} title="Account Registration" />
          <P>To access certain features you must create an account. You agree to provide accurate information, keep your password secure, notify us of unauthorized access at <A href="mailto:support@liftpitch.co">support@liftpitch.co</A>, and not share credentials. LiftPitch may terminate accounts with false information.</P>
        </div>

        <div id="t5" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={5} title="Subscription Plans & Payments" />
          <UL items={[
            <><strong>Free Tier:</strong> One job match check, one AI script, one watermarked video</>,
            <><strong>Pro Monthly — $8.00/mo:</strong> Unlimited scripts, recordings, analytics, no watermark</>,
            <><strong>Lifetime Pass — $35.00:</strong> All Pro features, no recurring billing</>,
          ]} />
          <HL><strong>Refund Policy:</strong> Monthly plans cancel anytime; access continues through end of billing period. Lifetime passes are non-refundable after 14 days. Technical issues? Contact <A href="mailto:support@liftpitch.co">support@liftpitch.co</A> within 14 days for resolution or discretionary refund.</HL>
          <P>Pricing may change with 30 days' written notice to active subscribers.</P>
        </div>

        <div id="t6" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={6} title="Video Recording & Content License" badge="Updated" />
          <P>By recording a video you consent to live capture, processing, and storage of your video, audio, and likeness; represent you are the sole individual appearing; acknowledge anyone with your link can view it; and accept responsibility for all content including incidental third-party material.</P>
          <P>You retain full ownership of your recordings. LiftPitch will not use your video for advertising without explicit written consent.</P>
          <HL><strong>License Grant:</strong> You grant Pangea Square LLC a worldwide, non-exclusive, royalty-free, sublicensable license to host, store, reproduce, transcode, distribute, transmit, display, and perform your video as necessary to provide, operate, and improve the Service — including CDN delivery, thumbnail generation, secure backups, and anonymized aggregate analytics. This license does not permit Pangea Square LLC to sell your content or use it in advertising.</HL>
        </div>

        <div id="t7" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={7} title="Video Deletion & Link Expiration" badge="New" />
          <P>Videos are retained for up to <strong>[INSERT PERIOD, e.g., 12 months]</strong> from recording date unless you request earlier deletion at <A href="mailto:support@liftpitch.co">support@liftpitch.co</A>. Deletion is honored within 30 days. Upon deletion your shareable link is disabled and the file removed from active storage. Secure backup copies may persist up to [INSERT, e.g., 30 days] before purge.</P>
          <P><strong>Important:</strong> LiftPitch cannot retrieve or delete copies that third parties (recruiters, employers) may have saved before deletion. You acknowledge this limitation when sharing your link.</P>
        </div>

        <div id="t8" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={8} title="AI-Generated Scripts" badge="Updated" />
          <P>Scripts are generated using third-party AI providers processing your resume, job description, and About Me text. You acknowledge that:</P>
          <UL items={[
            "Scripts are for your personal job-search use only",
            "LiftPitch makes no warranty regarding originality, accuracy, or fitness of AI outputs",
            "Third-party AI providers operate under their own terms and data processing agreements",
            "LiftPitch does not use your data to train AI models without explicit written consent",
            "You are responsible for reviewing and editing any AI-generated content before use",
          ]} />
        </div>

        <div id="t9" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={9} title="Intellectual Property" />
          <P>All software, design, branding, platform infrastructure, and AI systems underlying LiftPitch are owned by Pangea Square LLC and protected by applicable law. You may not copy, reproduce, modify, reverse engineer, or distribute any part of the platform without express written permission.</P>
        </div>

        <div id="t10" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={10} title="DMCA & Copyright" badge="New" />
          <P>LiftPitch complies with the Digital Millennium Copyright Act. To report infringing content, send a written notice to our designated agent at <A href="mailto:legal@liftpitch.co">legal@liftpitch.co</A> (Subject: "DMCA Takedown Request") including: description of the copyrighted work; URL of infringing content; your contact info; good-faith belief statement; accuracy statement under penalty of perjury; and your signature. Repeat infringers may have accounts terminated.</P>
        </div>

        <div id="t11" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={11} title="Prohibited Conduct" />
          <P>You agree not to use LiftPitch to post unlawful or harassing content; impersonate others; circumvent live-recording verification; use bots or automated tools; reverse engineer the platform; transmit malware; harm LiftPitch's reputation; or record anyone other than yourself without their consent. Violations may result in immediate termination and legal liability.</P>
        </div>

        <div id="t12" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={12} title="Third-Party Services" badge="New" />
          <P>LiftPitch integrates with third-party providers for cloud storage, database, payments, email, and AI. These providers operate under their own terms and privacy policies. LiftPitch is not responsible for third-party practices and does not endorse any third-party service.</P>
        </div>

        <div id="t13" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={13} title="Disclaimers" />
          <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. LIFTPITCH DOES NOT WARRANT UNINTERRUPTED OR ERROR-FREE SERVICE, EMPLOYMENT OUTCOMES FROM AI SCRIPTS, COMPLETE FRAUD PREVENTION, OR EMPLOYER ENGAGEMENT WITH YOUR VIDEO. LiftPitch is a job-search tool, not an employment guarantee.</P>
        </div>

        <div id="t14" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={14} title="Limitation of Liability" />
          <P>TO THE MAXIMUM EXTENT PERMITTED BY MICHIGAN LAW, LIFTPITCH LLC SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF (A) AMOUNTS PAID IN THE THREE MONTHS PRECEDING THE CLAIM OR (B) FIFTY DOLLARS ($50.00).</P>
        </div>

        <div id="t15" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={15} title="Indemnification" />
          <P>You agree to indemnify, defend, and hold harmless Pangea Square LLC and its members, officers, and employees from claims, liabilities, damages, and expenses (including attorneys' fees) arising from your use of the Service, violation of these Terms, content you record or share, or violation of third-party rights.</P>
        </div>

        <div id="t16" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={16} title="Dispute Resolution & Arbitration" badge="New" />
          <P>Disputes shall first be addressed informally by contacting <A href="mailto:legal@liftpitch.co">legal@liftpitch.co</A> (30-day resolution period). If unresolved, disputes shall be settled by binding individual arbitration — not in court. <strong>You waive any right to jury trial and class action participation.</strong> Emergency injunctive relief remains available in court pending arbitration.</P>
        </div>

        <div id="t17" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={17} title="Termination" />
          <P>You may close your account at any time by contacting <A href="mailto:support@liftpitch.co">support@liftpitch.co</A>. Upon termination, your access ends immediately and videos are scheduled for deletion per Section 7. LiftPitch may terminate accounts for Terms violations or at our discretion with reasonable notice.</P>
        </div>

        <div id="t18" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={18} title="Governing Law" />
          <P>These Terms are governed by Michigan law. Non-arbitrated disputes shall be brought exclusively in <strong>[INSERT COUNTY, e.g., Oakland County]</strong>, Michigan courts.</P>
        </div>

        <div id="t19" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={19} title="General Provisions" badge="New" />
          <UL items={[
            <><strong>Entire Agreement:</strong> These Terms and Privacy Policy constitute the entire agreement between you and LiftPitch.</>,
            <><strong>Severability:</strong> If any provision is found invalid, remaining provisions continue in full effect.</>,
            <><strong>No Waiver:</strong> Failure to enforce any provision is not a waiver of that right.</>,
            <><strong>Assignment:</strong> You may not assign your rights without written consent. LiftPitch may assign freely.</>,
            <><strong>Force Majeure:</strong> LiftPitch is not liable for failures caused by circumstances beyond our reasonable control including natural disasters, government action, or internet outages.</>,
          ]} />
        </div>

        <div id="t20" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={20} title="Changes to These Terms" />
          <P>We will notify users of material changes via email or platform notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.</P>
        </div>

        <div id="t21" style={{ marginBottom: 0, scrollMarginTop: 80 }}>
          <SectionTitle number={21} title="Contact" />
          <ContactBox lines={[
            <><strong>Pangea Square LLC</strong></>,
            <>📧 General: <A href="mailto:support@liftpitch.co">support@liftpitch.co</A></>,
            <>📧 Legal / DMCA: <A href="mailto:legal@liftpitch.co">legal@liftpitch.co</A></>,
            <>🌐 <A href="https://liftpitch.co">liftpitch.co</A></>,
            <>📍 Michigan, United States</>,
          ]} />
        </div>
      </div>

      <div style={{ padding: "24px 40px", borderTop: `1px solid ${B.border}`, background: B.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: B.textDim, fontFamily: "'DM Sans', sans-serif" }}>© [YEAR] Pangea Square LLC · All rights reserved · Michigan LLC · v2</span>
        <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${B.border}`, background: B.surface, fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textMuted, cursor: "pointer" }}>🖨️ Print / Save PDF</button>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  const tocItems = [
    [1, "Who We Are & Relationship to Terms"], [2, "Information We Collect"],
    [3, "How We Use Your Information"], [4, "Video Data & Biometric Notice"],
    [5, "How We Share Your Information"], [6, "Third-Party AI Providers"],
    [7, "Data Retention"], [8, "Your Rights & Choices"], [9, "Data Security"],
    [10, "Cookies & Tracking"], [11, "Children's Privacy"],
    [12, "California Residents (CCPA/CPRA)"], [13, "Changes to This Policy"], [14, "Contact Us"],
  ];

  const tableStyle = { width: "100%", borderCollapse: "collapse", margin: "16px 0", fontSize: 13 };
  const thStyle = { background: B.bg, padding: "10px 14px", textAlign: "left", fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: B.textDim, borderBottom: `1px solid ${B.border}` };
  const tdStyle = { padding: "10px 14px", color: B.textMuted, borderBottom: `1px solid ${B.border}`, verticalAlign: "top", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" };

  return (
    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "36px 40px 28px", borderBottom: `1px solid ${B.border}`, background: "linear-gradient(135deg, rgba(10,102,194,0.04), rgba(55,143,233,0.02))" }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.accentLight, marginBottom: 10 }}>Pangea Square LLC · Legal · Version 2</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text, marginBottom: 12 }}>Privacy Policy</div>
        <div style={{ fontSize: 13, color: B.textDim, display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "'DM Sans', sans-serif" }}>
          <span>📅 Effective Date: [INSERT DATE]</span><span>📍 Michigan, United States</span>
        </div>
      </div>

      <div style={{ margin: "28px 40px 0", padding: "16px 20px", background: "rgba(231,163,62,0.08)", border: "1px solid rgba(231,163,62,0.25)", borderRadius: 12, fontSize: 13, color: "#7A5C1E", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
        <strong style={{ color: "#B5780F" }}>⚠️ Draft — Not Legal Advice.</strong> Have a licensed Michigan attorney review and finalize before publishing. Fill in every [bracketed field].
      </div>

      <div style={{ margin: "28px 40px 0", padding: "20px 24px", background: B.bg, border: `1px solid ${B.border}`, borderRadius: 14 }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: B.textDim, marginBottom: 12 }}>Table of Contents</div>
        <ol style={{ listStyle: "decimal", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
          {tocItems.map(([n, label]) => (
            <li key={n}><a href={`#p${n}`} style={{ fontSize: 13, color: B.accent, textDecoration: "none", fontWeight: 500 }}>{label}</a></li>
          ))}
        </ol>
      </div>

      <div style={{ padding: "36px 40px" }}>
        <div id="p1" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={1} title="Who We Are & Relationship to Terms of Service" badge="Updated" />
          <P>Pangea Square LLC ("Pangea Square," "we," "our," or "us") is a Michigan limited liability company and the legal entity behind LiftPitch, the product and platform operating at <A href="https://liftpitch.co">liftpitch.co</A>. References to "LiftPitch" throughout this Policy refer to the product and Service; references to "Pangea Square LLC" refer to the legal entity responsible for your data. This Privacy Policy is incorporated into and subject to our <A href="#tos">Terms of Service</A>. Together they govern your use of the Service. Users must affirmatively accept both documents during account creation.</P>
        </div>

        <div id="p2" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={2} title="Information We Collect" />
          <P><strong>Provided directly by you:</strong></P>
          <UL items={[
            "Name and email address (registration)",
            "Resume content (text or uploaded document)",
            "Job descriptions you paste into the platform",
            '"About Me" paragraph',
            "Payment information (processed by payment provider — we do not store card numbers)",
          ]} />
          <P><strong>Generated through your use of the Service:</strong></P>
          <UL items={[
            "Live video and audio recordings via your browser camera",
            "AI-generated scripts from your inputs",
            "Video view analytics (viewer IP, watch duration, timestamps)",
            "Verification metadata (session ID, recording timestamp, device stream confirmation)",
          ]} />
          <P><strong>Collected automatically:</strong></P>
          <UL items={[
            "IP address, browser type, operating system",
            "Pages visited, time on platform, referring URL",
            "Cookie and tracking data (see Section 10)",
          ]} />
        </div>

        <div id="p3" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={3} title="How We Use Your Information" />
          <UL items={[
            "Operate, maintain, and improve the LiftPitch platform",
            "Generate AI-powered scripts tailored to your resume and target job",
            "Store and deliver your video recordings via your shareable link",
            "Process payments and manage your subscription",
            "Send transactional emails and opted-in career tips",
            "Detect and prevent fraud, abuse, or unauthorized access",
            "Produce anonymized, aggregate analytics to improve Service performance",
            "Comply with applicable legal obligations",
          ]} />
          <P>We do not sell your personal information. We do not use your data or video recordings to train AI models without your explicit written consent.</P>
        </div>

        <div id="p4" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={4} title="Video Data & Biometric Notice" badge="Strengthened" />
          <HL><strong>Sensitive Data Notice:</strong> LiftPitch captures live video and audio through your device camera. Your recording includes your facial image and voice, which may be treated as sensitive personal information or biometric data under laws including California's CPRA.</HL>
          <P>By recording a video you explicitly consent to: live capture of your video and audio; secure cloud storage of your recording; delivery to anyone who accesses your shareable link; and retention for up to <strong>[INSERT PERIOD, e.g., 12 months]</strong> unless you request earlier deletion.</P>
          <P><strong>What we do NOT do with your video:</strong></P>
          <UL items={[
            "We do not extract, derive, or store separate facial geometry, voiceprints, or biometric templates",
            "We do not use your video for automated identification, facial recognition, or profiling beyond basic verification metadata",
            "Your video is stored as a raw recording used only for delivery and Service operation",
            "We do not sell your video or use it in advertising without explicit written consent",
          ]} />
          <P>Request deletion at any time: <A href="mailto:privacy@liftpitch.co">privacy@liftpitch.co</A>. Honored within 30 days.</P>
        </div>

        <div id="p5" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={5} title="How We Share Your Information" />
          <P>We do not sell or rent your personal information. We share only in these limited circumstances:</P>
          <UL items={[
            <><strong>Service Providers:</strong> Cloudflare R2 (video storage), Supabase (database/auth), Lemon Squeezy (payments), Resend (email) — each contractually limited to processing data per our instructions only</>,
            <><strong>AI Providers:</strong> Resume, job description, and About Me text sent to generate your script. See Section 6.</>,
            <><strong>Your Shareable Link:</strong> Anyone with your link can view your video. You control distribution.</>,
            <><strong>Legal Requirements:</strong> Disclosure required by law, court order, or government authority</>,
            <><strong>Business Transfer:</strong> Data may transfer in acquisition or merger; you will be notified in advance</>,
          ]} />
        </div>

        <div id="p6" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={6} title="Third-Party AI Providers" badge="New" />
          <P>To generate scripts, LiftPitch sends your resume content, job description, and About Me text to third-party AI providers operating under their own terms and data processing agreements. We select providers that maintain industry-standard data protection and do not authorize them to train models on your personal data. We do not send your video recordings to any AI provider.</P>
        </div>

        <div id="p7" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={7} title="Data Retention" badge="Updated" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Data Type</th>
                <th style={thStyle}>Retention Period</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Video recordings", "[e.g., 12 months] from recording date", "Shareable link disabled upon deletion."],
                ["Backup copies of videos", "Up to [e.g., 30 days] after deletion", "Purged from backup systems on rolling schedule."],
                ["Resume & script data", "Duration of account or [INSERT] after last activity", "Deleted on account closure request."],
                ["Account data", "Until deletion requested", "Processed within 30 days."],
                ["Payment records", "7 years", "Required by U.S. tax law."],
                ["Analytics & logs", "[e.g., 24 months]", "Anonymized after [INSERT period]."],
              ].map(([type, period, notes], i, arr) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{type}</td>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{period}</td>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <P>Request full account and data deletion: <A href="mailto:privacy@liftpitch.co">privacy@liftpitch.co</A>. Completed within 30 days except where law requires retention.</P>
        </div>

        <div id="p8" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={8} title="Your Rights & Choices" />
          <UL items={[
            <><strong>Access:</strong> Request a copy of your personal data</>,
            <><strong>Correction:</strong> Request correction of inaccurate data</>,
            <><strong>Deletion:</strong> Request deletion of your account and data</>,
            <><strong>Portability:</strong> Request your data in a portable format</>,
            <><strong>Opt-Out:</strong> Unsubscribe from marketing emails via the link in any email</>,
            <><strong>Withdraw Consent:</strong> Withdraw video storage consent by requesting deletion</>,
            <><strong>Limit Sensitive Data Use:</strong> Request that use of your video and sensitive personal information be limited strictly to Service delivery</>,
          ]} />
          <P>Contact <A href="mailto:privacy@liftpitch.co">privacy@liftpitch.co</A>. We respond within 30 days.</P>
        </div>

        <div id="p9" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={9} title="Data Security" />
          <P>We protect your data with encrypted transmission (HTTPS/TLS), secure cloud storage with access controls, authentication controls for account access, and regular infrastructure security reviews. No internet transmission is 100% secure. In the event of a breach we will notify you as required by law.</P>
        </div>

        <div id="p10" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={10} title="Cookies & Tracking" />
          <P>We use cookies to maintain login sessions, remember preferences, analyze platform usage, and track video view analytics. We do not use third-party advertising cookies or permit ad networks to track users on our platform. You may control cookies via browser settings; disabling them may affect platform functionality.</P>
        </div>

        <div id="p11" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={11} title="Children's Privacy" />
          <P>LiftPitch is not directed at individuals under 18 and does not knowingly collect personal information from minors, in compliance with COPPA. If we learn a minor has used our Service, we will delete their data promptly. Contact <A href="mailto:privacy@liftpitch.co">privacy@liftpitch.co</A> with concerns.</P>
        </div>

        <div id="p12" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={12} title="California Residents (CCPA/CPRA)" badge="Expanded" />
          <P>California residents have rights under the CCPA as amended by CPRA. Categories of personal information we collect:</P>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Examples</th>
                <th style={thStyle}>Business Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Identifiers", "Name, email, IP address", "Account management, communication"],
                ["Sensitive PI — Biometric / Likeness", "Facial image, voice (video recordings)", "Video delivery via shareable link only"],
                ["Professional / Employment Data", "Resume content, job descriptions", "AI script generation"],
                ["Internet / Network Activity", "Pages visited, watch duration", "Analytics, platform improvement"],
                ["Inferences", "AI-generated script outputs", "Delivered to user for personal use only"],
                ["Commercial Information", "Subscription tier, payment history", "Billing, account management"],
              ].map(([cat, ex, purpose], i, arr) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{cat}</td>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{ex}</td>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <P style={{ marginTop: 14 }}><strong>Your California rights:</strong></P>
          <UL items={[
            "Right to know what personal information we collect, use, disclose, and share",
            "Right to delete your personal information",
            "Right to correct inaccurate personal information",
            "Right to opt out of sale or sharing (LiftPitch does not sell personal information)",
            "Right to limit use of sensitive personal information to what is necessary for Service delivery",
            "Right to non-discrimination for exercising these rights",
          ]} />
          <P>To exercise California rights: <A href="mailto:privacy@liftpitch.co">privacy@liftpitch.co</A> — Subject: "CCPA Request." We respond within 45 days as required by law.</P>
        </div>

        <div id="p13" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={13} title="Changes to This Policy" />
          <P>Material changes will be communicated via email or platform notice at least 14 days before taking effect, consistent with our Terms of Service. The Effective Date above reflects the most recent update.</P>
        </div>

        <div id="p14" style={{ marginBottom: 0, scrollMarginTop: 80 }}>
          <SectionTitle number={14} title="Contact Us" />
          <ContactBox lines={[
            <><strong>Pangea Square LLC — Privacy Team</strong></>,
            <>📧 Privacy requests: <A href="mailto:privacy@liftpitch.co">privacy@liftpitch.co</A></>,
            <>📧 General support: <A href="mailto:support@liftpitch.co">support@liftpitch.co</A></>,
            <>📧 Legal / DMCA: <A href="mailto:legal@liftpitch.co">legal@liftpitch.co</A></>,
            <>🌐 <A href="https://liftpitch.co">liftpitch.co</A></>,
            <>📍 Michigan, United States</>,
          ]} />
        </div>
      </div>

      <div style={{ padding: "24px 40px", borderTop: `1px solid ${B.border}`, background: B.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: B.textDim, fontFamily: "'DM Sans', sans-serif" }}>© [YEAR] Pangea Square LLC · All rights reserved · Michigan LLC · v2</span>
        <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${B.border}`, background: B.surface, fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textMuted, cursor: "pointer" }}>🖨️ Print / Save PDF</button>
      </div>
    </div>
  );
}

export default function LegalPage() {
  const [tab, setTab] = useState("tos");

  return (
    <div style={{ minHeight: "100vh", background: B.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${B.border}`, padding: "18px 40px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <a href="/" style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, background: B.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>
          LiftPitch
        </a>
        <span style={{ color: B.border, fontSize: 20 }}>|</span>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 600, color: B.textMuted }}>Legal Documents</span>
      </header>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "24px 20px 0" }}>
        {[
          { id: "tos", label: "📋 Terms of Service" },
          { id: "privacy", label: "🔒 Privacy Policy" },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{
            padding: "12px 32px", borderRadius: 12,
            border: `1.5px solid ${tab === t.id ? B.accent : B.border}`,
            background: B.surface,
            fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
            color: tab === t.id ? B.text : B.textMuted,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: tab === t.id ? `0 0 0 3px rgba(10,102,194,0.08)` : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        {tab === "tos" && <TermsOfService />}
        {tab === "privacy" && <PrivacyPolicy />}
      </div>

      <style>{`
        @media (max-width: 600px) {
          header { padding: 16px 20px !important; }
        }
        @media print {
          header, .tab-bar { display: none; }
        }
      `}</style>
    </div>
  );
}
