"use client";

import { useState, useEffect } from "react";

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
    [4, "Accounts & Accountless Recording"], [5, "Sponsored Recordings for Employers"],
    [6, "We Do Not Evaluate You"], [7, "Subscription Plans & Payments"],
    [8, "Video Recording & Content License"], [9, "Video Deletion & Link Expiration"],
    [10, "AI-Assisted Scripts"], [11, "Intellectual Property"], [12, "Prohibited Conduct"],
    [13, "Third-Party Services"], [14, "Disclaimers"], [15, "Limitation of Liability"],
    [16, "Indemnification"], [17, "Dispute Resolution & Arbitration"], [18, "Termination"],
    [19, "Governing Law"], [20, "Changes & Contact"],
  ];

  return (
    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "36px 40px 28px", borderBottom: `1px solid ${B.border}`, background: "linear-gradient(135deg, rgba(10,102,194,0.04), rgba(55,143,233,0.02))" }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.accentLight, marginBottom: 10 }}>Pangea Square LLC · Legal · Version 4</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text, marginBottom: 12 }}>Terms of Service</div>
        <div style={{ fontSize: 13, color: B.textDim, display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "'DM Sans', sans-serif" }}>
          <span>📅 Effective Date: July 16, 2026</span><span>📍 Michigan, United States</span>
        </div>
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
          <P>By accessing or using LiftPitch ("the Service"), a product of Pangea Square LLC, a Michigan limited liability company ("Pangea Square," "we," "us," or "our"), you agree to these Terms of Service ("Terms") and our <A href="#privacy">Privacy Policy</A>. If you do not agree, do not use the Service. These Terms form a legally binding agreement between you and Pangea Square LLC.</P>
          <P>You accept these Terms either by creating an account or, if you record without an account, by checking the consent box shown to you before you receive your video link.</P>
        </div>

        <div id="t2" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={2} title="Description of Service" />
          <P>LiftPitch is a web-based platform that lets you:</P>
          <UL items={[
            "Record short, live-verified video pitches in-browser using your device camera and microphone",
            "Record a pitch for a specific employer's role by opening a recording link the employer provides",
            "Receive a shareable link to your recorded video to include on resumes or job applications",
            "Optionally use AI-assisted tools to help you prepare your own pitch",
          ]} />
          <HL><strong>Live-Only Recording:</strong> LiftPitch does not accept pre-recorded uploads or AI-generated video. Every pitch is recorded live in your browser — this is core to the verification that employers rely on.</HL>
        </div>

        <div id="t3" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={3} title="Eligibility" />
          <P>You must be at least 18 years old to use LiftPitch. By using the Service you represent that you are 18 or older and can enter a binding agreement. The Service is currently available to users in the United States.</P>
        </div>

        <div id="t4" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={4} title="Accounts & Accountless Recording" />
          <P>Some features require an account, where you agree to provide accurate information, keep your password secure, and notify us of unauthorized use at <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A>.</P>
          <P>You may also record a pitch for an employer's role without creating an account. In that case, before you receive your link, you provide your name, an optional email address (so we can send you your link), and your consent to record and share the video. You remain the owner of your video whether or not you create an account.</P>
        </div>

        <div id="t5" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={5} title="Sponsored Recordings for Employers" />
          <P>When you open a recording link from an employer, you are recording a pitch for that employer's role. By recording, you understand that:</P>
          <UL items={[
            "Your video, your name, and your responses will be shared with that employer through the link you receive and choose to submit",
            "You choose whether to submit your link to the employer; sharing it is your action",
            "The employer, not LiftPitch, decides whether to review your pitch and makes all hiring decisions",
            "You are recording only yourself, live, in real time",
          ]} />
        </div>

        <div id="t6" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={6} title="We Do Not Evaluate You" />
          <HL><strong>LIFTPITCH NEVER SCORES OR RANKS YOU.</strong> LiftPitch does not score, rank, grade, rate, or reject you, and does not use artificial intelligence to judge, assess, or make any decision about you or your pitch. We record your live video and deliver it to you (and, for a sponsored role, to the employer you choose to share it with). Real people at the employer decide what happens next.</HL>
          <P>Any AI-assisted preparation tools we offer exist only to help you prepare your own pitch; their output belongs to you and is never used to grade you or shared with an employer as a score.</P>
        </div>

        <div id="t7" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={7} title="Subscription Plans & Payments" />
          <P>Recording a pitch for an employer's sponsored role is always free to you. If we offer optional paid candidate features, their pricing and terms will be shown before you purchase, monthly plans may be cancelled anytime (access continues through the billing period), and any one-time purchases are non-refundable after 14 days except where required by law. For payment issues, contact <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A> within 14 days.</P>
        </div>

        <div id="t8" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={8} title="Video Recording & Content License" />
          <P>By recording a video you consent to the live capture, processing, and storage of your video, audio, and likeness; represent that you are the only person appearing; acknowledge that anyone with your link can view it; and accept responsibility for the content, including any incidental third-party material.</P>
          <P>You keep full ownership of your recordings. We will not use your video in advertising or sell it without your explicit written consent.</P>
          <HL><strong>License Grant:</strong> You grant Pangea Square LLC a worldwide, non-exclusive, royalty-free, sublicensable license to host, store, reproduce, transcode, distribute, transmit, and display your video only as needed to provide and operate the Service — including CDN delivery, thumbnails, secure backups, and delivery to anyone with your link. This does not permit us to sell your content or use it in advertising.</HL>
        </div>

        <div id="t9" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={9} title="Video Deletion & Link Expiration" />
          <P>Videos are retained for up to <strong>12 months</strong> from the recording date unless you request earlier deletion at <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A> or <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A>. Deletion is honored within 30 days; your link is then disabled and the file removed from active storage, though secure backups may persist up to 30 more days before purge.</P>
          <P><strong>Important:</strong> We cannot retrieve or delete copies that an employer or anyone else may have saved before deletion. Keep this in mind when you share your link.</P>
        </div>

        <div id="t10" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={10} title="AI-Assisted Scripts" />
          <P>If you use our optional script tools, they process the resume, job description, and personal text you provide through third-party AI providers to help you prepare. You acknowledge that these outputs are for your personal job search, that we make no warranty about their accuracy or fitness, that you are responsible for reviewing and editing them, and that we do not use your data to train AI models without your explicit written consent.</P>
        </div>

        <div id="t11" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={11} title="Intellectual Property" />
          <P>All software, design, branding, and infrastructure underlying LiftPitch are owned by Pangea Square LLC and protected by law. You may not copy, modify, reverse engineer, or distribute any part of the platform without our written permission. This does not affect your ownership of your own recordings.</P>
        </div>

        <div id="t12" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={12} title="Prohibited Conduct" />
          <P>You agree not to: post unlawful or harassing content; impersonate anyone; record any person other than yourself without their consent; circumvent the live-recording verification; use bots or automated tools; reverse engineer or disrupt the platform; transmit malware; or misuse the Service. Violations may result in immediate termination and legal liability.</P>
        </div>

        <div id="t13" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={13} title="Third-Party Services" />
          <P>LiftPitch relies on third-party providers for cloud storage, video hosting, database, email, and AI. These providers operate under their own terms and privacy policies. We are not responsible for third-party practices and do not endorse any third-party service.</P>
        </div>

        <div id="t14" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={14} title="Disclaimers" />
          <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE SERVICE, ANY EMPLOYMENT OUTCOME, OR THAT ANY EMPLOYER WILL VIEW YOUR VIDEO. LIFTPITCH IS A JOB-SEARCH TOOL, NOT AN EMPLOYMENT GUARANTEE.</P>
        </div>

        <div id="t15" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={15} title="Limitation of Liability" />
          <P>TO THE MAXIMUM EXTENT PERMITTED BY MICHIGAN LAW, PANGEA SQUARE LLC WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY TO YOU WILL NOT EXCEED THE GREATER OF (A) AMOUNTS YOU PAID US IN THE THREE MONTHS BEFORE THE CLAIM OR (B) FIFTY DOLLARS ($50.00).</P>
        </div>

        <div id="t16" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={16} title="Indemnification" />
          <P>You agree to indemnify, defend, and hold harmless Pangea Square LLC and its members, officers, and employees from claims, liabilities, damages, and expenses (including attorneys' fees) arising from your use of the Service, your violation of these Terms, the content you record or share, or your violation of third-party rights.</P>
        </div>

        <div id="t17" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={17} title="Dispute Resolution & Arbitration" />
          <P>Disputes will first be addressed informally by contacting <A href="mailto:legal@lift-pitch.co">legal@lift-pitch.co</A> (30-day period). If unresolved, disputes will be settled by binding individual arbitration — not in court. You waive any right to a jury trial and to class-action participation. Emergency injunctive relief remains available in court pending arbitration.</P>
        </div>

        <div id="t18" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={18} title="Termination" />
          <P>You may stop using the Service or close your account at any time by contacting <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A>. Upon termination, your videos are scheduled for deletion per Section 9. We may suspend or terminate access for Terms violations or at our discretion with reasonable notice.</P>
        </div>

        <div id="t19" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={19} title="Governing Law" />
          <P>These Terms are governed by Michigan law. Non-arbitrated disputes will be brought exclusively in <strong>Macomb County</strong>, Michigan courts.</P>
        </div>

        <div id="t20" style={{ marginBottom: 0, scrollMarginTop: 80 }}>
          <SectionTitle number={20} title="Changes & Contact" />
          <P>We will notify users of material changes by email or platform notice at least 14 days before they take effect. Continued use after the effective date is acceptance.</P>
          <ContactBox lines={[
            <><strong>Pangea Square LLC</strong></>,
            <>📧 General: <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A></>,
            <>📧 Legal: <A href="mailto:legal@lift-pitch.co">legal@lift-pitch.co</A></>,
            <>🌐 <A href="https://lift-pitch.co">lift-pitch.co</A></>,
            <>📍 Michigan, United States</>,
          ]} />
        </div>
      </div>

      <div style={{ padding: "24px 40px", borderTop: `1px solid ${B.border}`, background: B.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: B.textDim, fontFamily: "'DM Sans', sans-serif" }}>© 2026 Pangea Square LLC · All rights reserved · Michigan LLC</span>
        <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${B.border}`, background: B.surface, fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textMuted, cursor: "pointer" }}>🖨️ Print / Save PDF</button>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  const tocItems = [
    [1, "Who We Are"], [2, "Information We Collect"], [3, "How We Use Your Information"],
    [4, "Video Data & Biometric Notice"], [5, "Sponsored Recordings & Roles of the Parties"],
    [6, "How We Share Your Information"], [7, "Third-Party AI Providers"], [8, "Data Retention"],
    [9, "Your Rights & Choices"], [10, "Data Security"], [11, "Cookies & Tracking"],
    [12, "Children's Privacy"], [13, "California Residents (CCPA/CPRA)"], [14, "Changes & Contact"],
  ];

  const tableStyle = { width: "100%", borderCollapse: "collapse", margin: "16px 0", fontSize: 13 };
  const thStyle = { background: B.bg, padding: "10px 14px", textAlign: "left", fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: B.textDim, borderBottom: `1px solid ${B.border}` };
  const tdStyle = { padding: "10px 14px", color: B.textMuted, borderBottom: `1px solid ${B.border}`, verticalAlign: "top", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" };

  return (
    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "36px 40px 28px", borderBottom: `1px solid ${B.border}`, background: "linear-gradient(135deg, rgba(10,102,194,0.04), rgba(55,143,233,0.02))" }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.accentLight, marginBottom: 10 }}>Pangea Square LLC · Legal · Version 4</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text, marginBottom: 12 }}>Privacy Policy</div>
        <div style={{ fontSize: 13, color: B.textDim, display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "'DM Sans', sans-serif" }}>
          <span>📅 Effective Date: July 16, 2026</span><span>📍 Michigan, United States</span>
        </div>
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
          <SectionTitle number={1} title="Who We Are" />
          <P>Pangea Square LLC ("Pangea Square," "we," "our," or "us") is a Michigan limited liability company and the entity behind LiftPitch, operating at <A href="https://lift-pitch.co">lift-pitch.co</A>. "LiftPitch" refers to the product and Service; "Pangea Square LLC" is the legal entity responsible for your data. This Privacy Policy is incorporated into our <A href="#tos">Terms of Service</A> and, for employers, our <A href="#employer">Employer Agreement</A>.</P>
        </div>

        <div id="p2" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={2} title="Information We Collect" />
          <P><strong>Provided directly by you:</strong></P>
          <UL items={[
            "Name (required to receive a video link) and email address (optional for accountless recording; required for an account)",
            "Your consent record — the fact, time, and version of the terms you accepted",
            'Resume content, job descriptions, and "About Me" text, if you use the optional script tools',
            "Payment information, if you buy an optional paid feature (processed by our payment provider — we do not store card numbers)",
          ]} />
          <P><strong>Generated through your use of the Service:</strong></P>
          <UL items={[
            "Live video and audio recordings captured through your browser camera",
            "Video view analytics (viewer IP, watch duration, timestamps)",
            "Verification metadata (session ID, recording timestamp, device-stream confirmation, verification hash)",
            "For a sponsored recording: the sponsoring employer and role associated with your pitch",
          ]} />
          <P><strong>Collected automatically:</strong> IP address, browser type, operating system, pages visited, and cookie data (see Section 11).</P>
        </div>

        <div id="p3" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={3} title="How We Use Your Information" />
          <UL items={[
            "Operate, maintain, secure, and improve the Service",
            "Record, store, and deliver your video through your shareable link",
            "For sponsored recordings, deliver your pitch to the employer whose link you used and chose to submit",
            "Generate optional AI-assisted script drafts from inputs you provide",
            "Send you your link and transactional messages, and process any payments",
            "Detect and prevent fraud, abuse, or unauthorized access",
            "Comply with legal obligations",
          ]} />
          <P>We do not sell your personal information. We do not use your data or recordings to train AI models without your explicit written consent. We do not use AI to score, rank, or make decisions about you.</P>
        </div>

        <div id="p4" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={4} title="Video Data & Biometric Notice" />
          <HL><strong>Sensitive Data Notice:</strong> LiftPitch captures live video and audio through your device camera. Your recording includes your facial image and voice, which may be treated as sensitive personal information or biometric data under laws including the Illinois Biometric Information Privacy Act (BIPA) and California's CPRA.</HL>
          <P>By recording, you explicitly consent to the live capture, secure storage, and delivery (to anyone with your link) of your video and audio, and to retention for up to <strong>12 months</strong> unless you request earlier deletion.</P>
          <P><strong>What we do NOT do with your video:</strong></P>
          <UL items={[
            "We do not create, extract, or store faceprints, voiceprints, facial-geometry scans, or other biometric identifiers or templates from your video",
            "We do not use facial recognition or automated identification, and we do not profile you beyond basic verification metadata",
            "Your video is stored as an ordinary recording used only to deliver and operate the Service",
            "We do not sell your video or use it in advertising without your explicit written consent",
          ]} />
          <P>Request deletion any time at <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A>. Honored within 30 days.</P>
        </div>

        <div id="p5" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={5} title="Sponsored Recordings & Roles of the Parties" />
          <P>When you record using an employer's recording link, you are recording a pitch for that employer's role. The name, optional email, consent record, and video you provide are delivered to that employer through the link you receive and choose to submit.</P>
          <P>For that employer-directed information, we generally act as a service provider / processor to the employer, handling the information to provide the Service, while also acting as an independent controller for operating and securing the platform and for our direct relationship with you as our user. The employer is responsible for how it uses your pitch in its hiring process.</P>
        </div>

        <div id="p6" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={6} title="How We Share Your Information" />
          <P>We do not sell or rent your personal information. We share only as follows:</P>
          <UL items={[
            <><strong>Sponsoring Employer:</strong> For a sponsored recording, your pitch, name, and responses are delivered to the employer whose link you used, via the link you choose to submit</>,
            <><strong>Service Providers:</strong> Cloudflare (video storage/streaming), Supabase (database/auth), our payment processor, and Resend (email) — each limited to processing data on our instructions</>,
            <><strong>AI Providers:</strong> Only the resume, job description, and About Me text you submit to the optional script tools — never your video. See Section 7.</>,
            <><strong>Anyone With Your Link:</strong> Video links are viewable by anyone who has them; you control distribution</>,
            <><strong>Legal & Business Transfers:</strong> Where required by law, or in a merger or acquisition with notice to you</>,
          ]} />
        </div>

        <div id="p7" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={7} title="Third-Party AI Providers" />
          <P>If you use the optional script tools, we send the resume content, job description, and About Me text you provide to third-party AI providers operating under their own terms. We select providers that maintain industry-standard protections and do not authorize them to train models on your personal data. We never send your video recordings to any AI provider, and no AI provider scores or ranks you.</P>
        </div>

        <div id="p8" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={8} title="Data Retention" />
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
                ["Video recordings", "12 months from recording date", "Link disabled upon deletion."],
                ["Backup copies of videos", "Up to 30 days after deletion", "Purged on a rolling schedule."],
                ["Name, email & consent record", "With the associated video, or until deletion requested", "Consent record kept for compliance."],
                ["Resume & script data", "Account duration, or 90 days after last activity", "Deleted on account-closure request."],
                ["Payment records", "7 years", "Required by U.S. tax law."],
                ["Analytics & logs", "25 months", "Anonymized after 25 months."],
              ].map(([type, period, notes], i, arr) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{type}</td>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{period}</td>
                  <td style={{ ...tdStyle, borderBottom: i === arr.length - 1 ? "none" : `1px solid ${B.border}` }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <P>Request full deletion at <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A>. Completed within 30 days except where law requires retention.</P>
        </div>

        <div id="p9" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={9} title="Your Rights & Choices" />
          <UL items={[
            <><strong>Access, Correction, Deletion, Portability</strong> of your personal data</>,
            <><strong>Withdraw Consent</strong> to video storage by requesting deletion</>,
            <><strong>Opt Out</strong> of marketing emails via the unsubscribe link</>,
            <><strong>Limit Sensitive Data Use</strong> to what is necessary to deliver the Service</>,
          ]} />
          <P>Contact <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A>. We respond within 30 days.</P>
        </div>

        <div id="p10" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={10} title="Data Security" />
          <P>We protect your data with encrypted transmission (HTTPS/TLS), secure cloud storage with access controls, authentication controls, and regular security reviews. No transmission over the internet is 100% secure. In the event of a breach we will notify you as required by law.</P>
        </div>

        <div id="p11" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={11} title="Cookies & Tracking" />
          <P>We use cookies to keep you logged in, remember preferences, analyze usage, and track video-view analytics. We do not use third-party advertising cookies or let ad networks track users on our platform. You can control cookies in your browser; disabling them may affect functionality.</P>
        </div>

        <div id="p12" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={12} title="Children's Privacy" />
          <P>LiftPitch is not directed to anyone under 18 and does not knowingly collect their information. If we learn a minor has used the Service, we will delete their data promptly. Contact <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A> with concerns.</P>
        </div>

        <div id="p13" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={13} title="California Residents (CCPA/CPRA)" />
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
                ["Identifiers", "Name, email, IP address", "Account/link delivery, communication"],
                ["Sensitive PI — Biometric / Likeness", "Facial image, voice (video recordings)", "Video delivery via your link only"],
                ["Professional / Employment Data", "Resume content, job descriptions", "Optional AI script generation"],
                ["Internet / Network Activity", "Pages visited, watch duration", "Analytics, platform improvement"],
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
          <P>You have the right to know, delete, and correct your information; to opt out of sale or sharing (we do not sell or share personal information); to limit use of sensitive personal information to Service delivery; and to non-discrimination for exercising these rights. To exercise them, email <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A> — Subject: "CCPA Request." We respond within 45 days.</P>
        </div>

        <div id="p14" style={{ marginBottom: 0, scrollMarginTop: 80 }}>
          <SectionTitle number={14} title="Changes & Contact" />
          <P>Material changes will be communicated by email or platform notice at least 14 days before taking effect. The Effective Date above reflects the most recent update.</P>
          <ContactBox lines={[
            <><strong>Pangea Square LLC — Privacy Team</strong></>,
            <>📧 Privacy: <A href="mailto:privacy@lift-pitch.co">privacy@lift-pitch.co</A></>,
            <>📧 General: <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A></>,
            <>📧 Legal: <A href="mailto:legal@lift-pitch.co">legal@lift-pitch.co</A></>,
            <>🌐 <A href="https://lift-pitch.co">lift-pitch.co</A></>,
            <>📍 Michigan, United States</>,
          ]} />
        </div>
      </div>

      <div style={{ padding: "24px 40px", borderTop: `1px solid ${B.border}`, background: B.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: B.textDim, fontFamily: "'DM Sans', sans-serif" }}>© 2026 Pangea Square LLC · All rights reserved · Michigan LLC</span>
        <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${B.border}`, background: B.surface, fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textMuted, cursor: "pointer" }}>🖨️ Print / Save PDF</button>
      </div>
    </div>
  );
}

function EmployerAgreement() {
  const tocItems = [
    [1, "Acceptance & Parties"], [2, "The Employer Services"], [3, "Eligibility & Authority to Bind"],
    [4, "Free Trial"], [5, "Subscription Plans, Fees & Billing"], [6, "No Candidate Evaluation by LiftPitch"],
    [7, "Your Hiring & Compliance Responsibilities"], [8, "Interview Questions & Non-Discrimination"],
    [9, "Candidate Data & Roles of the Parties"], [10, "Consent & Live Verification"], [11, "Acceptable Use"],
    [12, "Brand License"], [13, "Confidentiality"], [14, "Disclaimers"], [15, "Limitation of Liability"],
    [16, "Indemnification"], [17, "Term & Termination"], [18, "Dispute Resolution & Arbitration"],
    [19, "Governing Law"], [20, "General Provisions"], [21, "Contact"],
  ];

  return (
    <div style={{ background: B.surface, border: `1px solid ${B.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "36px 40px 28px", borderBottom: `1px solid ${B.border}`, background: "linear-gradient(135deg, rgba(10,102,194,0.04), rgba(55,143,233,0.02))" }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: B.accentLight, marginBottom: 10 }}>Pangea Square LLC · For Employers · Version 4</div>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: B.text, marginBottom: 12 }}>Employer Agreement</div>
        <div style={{ fontSize: 13, color: B.textDim, display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "'DM Sans', sans-serif" }}>
          <span>📅 Effective Date: July 16, 2026</span><span>📍 Michigan, United States</span>
        </div>
      </div>

      <div style={{ margin: "28px 40px 0", padding: "20px 24px", background: B.bg, border: `1px solid ${B.border}`, borderRadius: 14 }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: B.textDim, marginBottom: 12 }}>Table of Contents</div>
        <ol style={{ listStyle: "decimal", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
          {tocItems.map(([n, label]) => (
            <li key={n}><a href={`#e${n}`} style={{ fontSize: 13, color: B.accent, textDecoration: "none", fontWeight: 500 }}>{label}</a></li>
          ))}
        </ol>
      </div>

      <div style={{ padding: "36px 40px" }}>
        <div id="e1" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={1} title="Acceptance & Parties" />
          <P>This Employer Agreement ("Agreement") is a legally binding contract between the company you represent ("Employer," "you," or "your") and Pangea Square LLC, a Michigan limited liability company ("Pangea Square," "we," "us," or "our"), which operates the LiftPitch platform ("LiftPitch" or the "Service") at <A href="https://lift-pitch.co">lift-pitch.co</A>.</P>
          <P>By creating an employer account, clicking to accept, or using the employer features of the Service, you agree to this Agreement and to our <A href="#privacy">Privacy Policy</A>. If you do not agree, do not use the employer features. This Agreement governs your use of the Service as an employer; the separate <A href="#tos">Terms of Service</A> govern individuals who record video pitches.</P>
        </div>

        <div id="e2" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={2} title="The Employer Services" />
          <P>LiftPitch lets you invite job candidates to record short, live-verified video pitches for your open roles. Through the Service you can:</P>
          <UL items={[
            "Create roles with one or two short questions and your brand colors",
            "Receive a branded recording link for each role to place in your applicant tracking system (ATS) or application workflow",
            "Receive, from candidates, a shareable link to their live-verified video pitch",
            "View those verified pitches on a branded recruiter page",
          ]} />
          <P>Candidates never pay to use LiftPitch. The Service is provided to you, the Employer, on the terms below.</P>
        </div>

        <div id="e3" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={3} title="Eligibility & Authority to Bind" />
          <P>You must be at least 18 years old and authorized to enter this Agreement on behalf of your organization. By accepting, you represent that you have that authority and that the organization will be bound. You agree to provide accurate account information, keep your credentials secure, and promptly notify us of any unauthorized use at <A href="mailto:legal@lift-pitch.co">legal@lift-pitch.co</A>.</P>
        </div>

        <div id="e4" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={4} title="Free Trial" />
          <P>We may offer a free trial of the employer features. During a free trial: the Service is provided at no charge for the trial period stated at sign-up; we will not charge you during the trial; and you may cancel at any time before the trial ends to avoid any charge.</P>
          <P>Unless you cancel before the trial ends, your paid subscription begins automatically when the trial ends, at the then-current price for the plan you selected, and the billing terms in Section 5 apply. Trial availability, length, and features may change, and a trial is generally limited to one per organization.</P>
        </div>

        <div id="e5" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={5} title="Subscription Plans, Fees & Billing" />
          <P>Paid plans are offered on a recurring subscription basis at the price and billing interval (for example, monthly or annually) shown for the plan you select, and are billed through our third-party payment processor. By starting a paid subscription, you authorize us to charge that recurring fee.</P>
          <P><strong>Auto-renewal &amp; cancellation:</strong> Your subscription renews automatically at the end of each billing period at the then-current price, until you cancel. You may cancel at any time; cancellation stops future renewals, and your access continues through the end of the period you have already paid for. Fees already paid are non-refundable except where required by law.</P>
          <P>We may change pricing or plan features on at least 30 days' notice to active subscribers, with changes taking effect at your next renewal. You are responsible for any applicable taxes. If a payment fails, we may suspend the paid features until it is resolved.</P>
        </div>

        <div id="e6" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={6} title="No Candidate Evaluation by LiftPitch" />
          <P>This section is central to how LiftPitch works and to your compliance posture. Please read it carefully.</P>
          <HL><strong>LIFTPITCH DOES NOT EVALUATE CANDIDATES.</strong> LiftPitch does not and will not score, rank, grade, rate, screen, filter, shortlist, flag, or reject any candidate, and provides no automated, algorithmic, or artificial-intelligence assessment, prediction, recommendation, or decision about any candidate. LiftPitch records a candidate's live video pitch and delivers it to you. Every review, comparison, and hiring decision is made solely by you and your human reviewers.</HL>
          <P>Because LiftPitch does not analyze candidates or output any assessment used to make, or substantially assist, an employment decision, LiftPitch is a recording-and-delivery tool — not an automated employment decision tool, and not an "AI screening" or "predictive" hiring product. You acknowledge and agree to this characterization, and agree not to represent LiftPitch as performing any candidate evaluation.</P>
        </div>

        <div id="e7" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={7} title="Your Hiring & Compliance Responsibilities" />
          <P>You are the employer and the decision-maker. As between you and Pangea Square, you are solely responsible for your recruiting and hiring process and for compliance with all applicable laws, including equal-employment-opportunity and anti-discrimination laws such as Title VII, the ADA, the ADEA, GINA, and their state and local equivalents, as well as any laws governing automated or AI-assisted hiring tools that you choose to use.</P>
          <UL items={[
            "You decide the questions, review the pitches, and make all hiring decisions",
            "You are responsible for any notices, consents, or bias audits your jurisdiction requires of you as an employer",
            "If you use any AI, scoring, or screening tool of your own — separate from LiftPitch — you are solely responsible for that tool and its compliance",
          ]} />
        </div>

        <div id="e8" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={8} title="Interview Questions & Non-Discrimination" />
          <P>You control the questions you configure for each role. You agree that your questions will be job-related and consistent with business necessity, and that you will not use LiftPitch to solicit information about, or to discriminate on the basis of, any legally protected characteristic (including race, color, religion, sex, national origin, age, disability, genetic information, or any characteristic protected by applicable law). You are responsible for the content of your questions and for how you use candidate pitches in your hiring decisions.</P>
        </div>

        <div id="e9" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={9} title="Candidate Data & Roles of the Parties" />
          <P>When you sponsor a role, candidates who record for that role provide their name, an optional email address, their consent, and their video pitch. That information is delivered to you to support your hiring process for the sponsored role.</P>
          <P><strong>Draft allocation of roles:</strong> For candidate information collected through your sponsored roles, Pangea Square acts as a service provider / processor, processing that information to provide the Service to you and on your instructions. You are responsible for having a lawful basis to invite candidates and to receive their pitches, and for providing candidates any notices your jurisdiction requires of you. Pangea Square remains an independent controller for operating and securing the LiftPitch platform. Each party will comply with applicable privacy and data-protection laws.</P>
          <P>You agree to use candidate information only for evaluating the candidate for the sponsored role, to keep it confidential, and not to sell it, re-identify beyond what the candidate provided, or use it for unrelated purposes.</P>
        </div>

        <div id="e10" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={10} title="Consent & Live Verification" />
          <P>Candidates provide consent at the moment of recording, before receiving their link. All pitches are recorded live in-browser: LiftPitch does not accept pre-recorded uploads or AI-generated video. You agree not to circumvent, disable, or misrepresent the live-verification feature, and you acknowledge that the "Live Verified" badge reflects LiftPitch's recording method, not a guarantee of any candidate's statements.</P>
        </div>

        <div id="e11" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={11} title="Acceptable Use" />
          <P>You agree not to: use the Service for any unlawful or discriminatory purpose; scrape, resell, or sublicense the Service or candidate data; attempt to reverse engineer or disrupt the platform; upload malware; misrepresent your identity or your organization; or use candidate data beyond the hiring process for the sponsored role. Violations may result in suspension or termination and may create legal liability.</P>
        </div>

        <div id="e12" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={12} title="Brand License" />
          <P>You grant Pangea Square a limited, non-exclusive, revocable license to display your company name and brand colors on the candidate recording page and recruiter pitch page solely to provide the Service. You represent that you have the right to grant this license. All rights in the LiftPitch platform, software, and branding remain with Pangea Square; nothing here transfers ownership of the platform to you.</P>
        </div>

        <div id="e13" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={13} title="Confidentiality" />
          <P>Each party may receive non-public information from the other. The receiving party will use it only to perform under this Agreement, protect it with reasonable care, and not disclose it except to those who need to know and are bound by similar obligations. This does not apply to information that is public, independently developed, or lawfully obtained without restriction.</P>
        </div>

        <div id="e14" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={14} title="Disclaimers" />
          <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. PANGEA SQUARE DOES NOT WARRANT UNINTERRUPTED OR ERROR-FREE SERVICE, ANY NUMBER OR QUALITY OF CANDIDATES, OR ANY HIRING OUTCOME. LIFTPITCH IS A RECRUITING TOOL, NOT EMPLOYMENT, LEGAL, OR COMPLIANCE ADVICE, AND IS NOT A SUBSTITUTE FOR YOUR OWN LEGAL REVIEW OF YOUR HIRING PRACTICES.</P>
        </div>

        <div id="e15" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={15} title="Limitation of Liability" />
          <P>TO THE MAXIMUM EXTENT PERMITTED BY MICHIGAN LAW, PANGEA SQUARE WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS OR HIRING DECISIONS. OUR TOTAL LIABILITY UNDER THIS AGREEMENT WILL NOT EXCEED THE GREATER OF (A) THE FEES YOU PAID US IN THE THREE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED DOLLARS ($100.00).</P>
        </div>

        <div id="e16" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={16} title="Indemnification" />
          <P>You agree to indemnify, defend, and hold harmless Pangea Square and its members, officers, and employees from any claims, liabilities, damages, and expenses (including reasonable attorneys' fees) arising from: your hiring and recruiting decisions; your compliance or non-compliance with employment, anti-discrimination, or privacy laws; the questions you configure; your use or handling of candidate data; or your breach of this Agreement.</P>
        </div>

        <div id="e17" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={17} title="Term & Termination" />
          <P>This Agreement applies while you use the employer features. Either party may terminate on written notice; you may close your employer account by contacting <A href="mailto:support@lift-pitch.co">support@lift-pitch.co</A>. On termination, your access to employer features ends. Candidate videos are owned by the candidates who recorded them and are governed by the Terms of Service and Privacy Policy; termination of your account does not delete candidate-owned videos. Sections that by their nature should survive (including 6, 9, 13–16, 18–20) survive termination.</P>
        </div>

        <div id="e18" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={18} title="Dispute Resolution & Arbitration" />
          <P>The parties will first try to resolve any dispute informally by contacting <A href="mailto:legal@lift-pitch.co">legal@lift-pitch.co</A> (30-day period). If unresolved, disputes will be settled by binding individual arbitration rather than in court, and each party waives any right to a jury trial and to participate in a class action. Either party may still seek emergency injunctive relief in court pending arbitration.</P>
        </div>

        <div id="e19" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={19} title="Governing Law" />
          <P>This Agreement is governed by the laws of the State of Michigan, without regard to conflict-of-laws rules. Any non-arbitrated dispute will be brought exclusively in the state or federal courts located in <strong>Macomb County</strong>, Michigan.</P>
        </div>

        <div id="e20" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
          <SectionTitle number={20} title="General Provisions" />
          <UL items={[
            <><strong>Entire Agreement:</strong> This Agreement and the incorporated Privacy Policy are the entire agreement between you and Pangea Square regarding the employer features.</>,
            <><strong>Severability:</strong> If any provision is found invalid, the rest remain in effect.</>,
            <><strong>No Waiver:</strong> Failure to enforce a provision is not a waiver.</>,
            <><strong>Assignment:</strong> You may not assign this Agreement without our written consent; we may assign it freely.</>,
            <><strong>Force Majeure:</strong> Neither party is liable for failures caused by events beyond its reasonable control.</>,
            <><strong>Changes:</strong> We may update this Agreement on reasonable notice; continued use after the effective date is acceptance.</>,
          ]} />
        </div>

        <div id="e21" style={{ marginBottom: 0, scrollMarginTop: 80 }}>
          <SectionTitle number={21} title="Contact" />
          <ContactBox lines={[
            <><strong>Pangea Square LLC — Employer Support</strong></>,
            <>📧 Employers: <A href="mailto:employers@lift-pitch.co">employers@lift-pitch.co</A></>,
            <>📧 Legal: <A href="mailto:legal@lift-pitch.co">legal@lift-pitch.co</A></>,
            <>🌐 <A href="https://lift-pitch.co">lift-pitch.co</A></>,
            <>📍 Michigan, United States</>,
          ]} />
        </div>
      </div>

      <div style={{ padding: "24px 40px", borderTop: `1px solid ${B.border}`, background: B.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: B.textDim, fontFamily: "'DM Sans', sans-serif" }}>© 2026 Pangea Square LLC · All rights reserved · Michigan LLC</span>
        <button onClick={() => window.print()} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${B.border}`, background: B.surface, fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: B.textMuted, cursor: "pointer" }}>🖨️ Print / Save PDF</button>
      </div>
    </div>
  );
}

const TABS = [
  { id: "tos", label: "📋 Terms of Service" },
  { id: "privacy", label: "🔒 Privacy Policy" },
  { id: "employer", label: "🏢 Employer Agreement" },
];

const HASH_TO_TAB = { tos: "tos", privacy: "privacy", employer: "employer" };

export default function LegalPage() {
  const [tab, setTab] = useState("tos");

  // Resolve #tos / #privacy / #employer to the correct tab — on mount and on
  // any later hash change (e.g. in-page cross-reference links). This is what
  // makes /legal#privacy and /legal#employer land on the right document.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (HASH_TO_TAB[hash]) setTab(HASH_TO_TAB[hash]);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const selectTab = (id) => {
    setTab(id);
    // Keep the URL hash in sync so state and address bar agree.
    if (typeof window !== "undefined" && window.location.hash.replace("#", "") !== id) {
      window.history.replaceState(null, "", `#${id}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "24px 20px 0", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => selectTab(t.id)} style={{
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
        {tab === "employer" && <EmployerAgreement />}
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
