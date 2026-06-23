// Deterministic ATS match score.
// Each keyword carries a weight (1–3). Score = (Σ weights of keywords whose term
// appears in the resume text) / (Σ all weights), as a 0–100 integer. The SAME
// function scores the original and the refined resume, so the two are comparable.
function keywordInText(keyword, lowerText) {
  const kw = String(keyword || "").trim().toLowerCase();
  if (!kw) return false;
  // Escape regex metachars, allow flexible whitespace between words, and accept an
  // optional trailing "s" (plural) when the term ends in a letter.
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const plural = /[a-z]$/.test(kw) ? "s?" : "";
  // Boundaries so "java" doesn't match inside "javascript", while "C++" / ".NET" still match.
  const re = new RegExp(`(?<![a-z0-9])${escaped}${plural}(?![a-z0-9])`, "i");
  return re.test(lowerText);
}

function scoreResume(resumeText, keywords) {
  const lower = String(resumeText || "").toLowerCase();
  let total = 0;
  let matched = 0;
  const present = new Set();
  for (const k of keywords) {
    total += k.weight;
    if (keywordInText(k.keyword, lower)) {
      matched += k.weight;
      present.add(k.keyword);
    }
  }
  return { score: total > 0 ? Math.round((matched / total) * 100) : 0, present };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return Response.json({ error: "Invalid request body JSON", detail: String(err) }, { status: 400 });
  }

  const { resume, jobDesc } = body || {};
  if (!resume || !jobDesc) {
    const missing = ["resume", "jobDesc"].filter((k) => !{ resume, jobDesc }[k]);
    return Response.json({ error: "Missing required fields", missing }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("refine-resume: ANTHROPIC_API_KEY is not set");
    return Response.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) optimization specialist and professional resume writer. A job seeker has pasted their resume and a job description. Extract the keywords the role screens for and produce concrete, honest improvements to the resume.

ABSOLUTE RULE — NEVER FABRICATE:
You must NEVER invent, exaggerate, or assume any experience, employer, job title, credential, certification, degree, skill, tool, metric, percentage, dollar figure, team size, date, or outcome that is not already explicitly present in the candidate's original resume. You may only rephrase, reorganize, surface, and emphasize what is genuinely there. If a job requirement is not supported by the resume, mark the corresponding keyword "unsupported" — do not write it into a bullet or the refined resume as if the candidate has it. Where adding a real metric would strengthen a bullet but none exists in the resume, use a clearly bracketed placeholder such as [X%] or [X] for the candidate to fill in with their own true number — never a fabricated value.

ABSOLUTE RULE — NEVER ALTER JOB TITLES, EMPLOYERS, OR DATES:
Copy every job title, company/employer name, and employment date range VERBATIM from the original resume. Do not upgrade, embellish, modernize, seniority-bump, or otherwise "promote" them — for example, never turn "Recruiter" into "Principal Technical Recruiter." The headline/summary line under the candidate's name may only use wording that appears in, or is directly and obviously supported by, the original resume — no inflated or aspirational titles.

Return your answer as a SINGLE valid JSON object and NOTHING else — no markdown code fences, no commentary before or after. Use exactly this shape:

{
  "keywords": [
    { "keyword": "<important skill/term from the job description>", "weight": <1 | 2 | 3>, "eligibility": "present" | "addable" | "unsupported" }
  ],
  "bulletImprovements": [
    { "original": "<the relevant line/phrase from the candidate's real resume, or a short note like 'New bullet from existing experience' if drawn from described experience>", "improved": "<stronger ATS-optimized rewrite grounded only in what the resume already shows>" }
  ],
  "fullResume": "<the candidate's complete resume, refined: same real facts, identical job titles/employers/dates, but with stronger action verbs, naturally woven-in keywords the candidate genuinely qualifies for, cleaner structure, and ATS-friendly formatting. Use plain text with line breaks. Do NOT add any experience, role, or credential not in the original.>"
}

Requirements:
- "keywords": extract 12 to 16 of the most important keywords, skills, tools, and qualifications from the JOB DESCRIPTION. For each:
  - "weight": how central it is to the role — 3 = core/required, 2 = important, 1 = nice-to-have.
  - "eligibility": judged against the ORIGINAL resume —
    - "present" if the original resume already clearly demonstrates it,
    - "addable" if the candidate's real experience genuinely supports it even though it is not yet stated (you should weave these into the refined resume),
    - "unsupported" if the candidate's background does not support it (do NOT add these).
  Use the exact same keyword spelling in this list as you naturally write it into the refined resume, so an automated text match can find it.
- "bulletImprovements": provide 3 to 4 rewritten bullet points. Each must be grounded strictly in the candidate's real experience from their resume — stronger verbs, clearer impact, relevant keywords they truly qualify for. Never add achievements they didn't state.
- "fullResume": rewrite the entire resume applying the improvements. Keep every real fact and every job title, employer, and date exactly as written. Only reorganize, sharpen wording, and incorporate keywords the candidate legitimately qualifies for ("present" and "addable").

RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

Output ONLY the JSON object.`;

  let anthropicResponse;
  try {
    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    console.error("refine-resume: network error calling Anthropic:", err);
    return Response.json({ error: "Failed to reach Anthropic API", detail: String(err) }, { status: 502 });
  }

  if (!anthropicResponse.ok) {
    const errBody = await anthropicResponse.text();
    console.error(`refine-resume: Anthropic returned ${anthropicResponse.status}:`, errBody);
    return Response.json(
      { error: `Anthropic API error ${anthropicResponse.status}`, detail: errBody },
      { status: 502 }
    );
  }

  let data;
  try {
    data = await anthropicResponse.json();
  } catch (err) {
    return Response.json({ error: "Failed to parse Anthropic response", detail: String(err) }, { status: 502 });
  }

  const text = data.content?.map((b) => b.text || "").join("") || "";

  // The model is instructed to return raw JSON, but be defensive: strip any
  // accidental code fences and grab the outermost JSON object.
  let parsed;
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const jsonSlice = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
    parsed = JSON.parse(jsonSlice);
  } catch (err) {
    console.error("refine-resume: failed to parse model JSON. Raw:", text.slice(0, 500));
    return Response.json({ error: "Could not parse analysis. Please try again.", detail: String(err) }, { status: 502 });
  }

  // Normalize / guard the shape so the client always gets safe defaults.
  const rawKeywords = Array.isArray(parsed.keywords)
    ? parsed.keywords
        .filter((k) => k && k.keyword)
        .map((k) => ({
          keyword: String(k.keyword),
          weight: [1, 2, 3].includes(k.weight) ? k.weight : 2,
          eligibility: ["present", "addable", "unsupported"].includes(k.eligibility)
            ? k.eligibility
            : "unsupported",
        }))
    : [];

  const fullResume = typeof parsed.fullResume === "string" ? parsed.fullResume : "";

  // Real, deterministic scores — same function, same keyword list, so they're
  // directly comparable. BEFORE scores the original resume; AFTER scores the
  // refined one (falling back to the original if no rewrite came back).
  const before = scoreResume(resume, rawKeywords);
  const after = scoreResume(fullResume || resume, rawKeywords);

  // Derive the display status from the SAME presence check that drives the score,
  // so the green list and the after-score always tell the same story:
  //   green  ("found")   = term is actually present in the refined resume
  //   yellow ("partial") = not present, but the candidate could honestly add it
  //   red    ("missing") = not present, and the background doesn't support it
  const keywords = rawKeywords.map((k) => {
    let status;
    if (after.present.has(k.keyword)) status = "found";
    else if (k.eligibility === "unsupported") status = "missing";
    else status = "partial";
    return { keyword: k.keyword, status };
  });

  const result = {
    matchScore: before.score,
    refinedScore: after.score,
    keywords,
    bulletImprovements: Array.isArray(parsed.bulletImprovements)
      ? parsed.bulletImprovements
          .filter((b) => b && b.improved)
          .map((b) => ({ original: String(b.original || ""), improved: String(b.improved) }))
      : [],
    fullResume,
  };

  return Response.json(result);
}
