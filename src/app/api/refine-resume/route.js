// Deterministic ATS match score.
// Each keyword carries a weight (1–3) and a set of matchTerms (the term plus tight
// synonyms / head term). A keyword counts as present if ANY of its matchTerms appears
// in the resume — this is what lets the ORIGINAL resume match concepts it phrases
// differently than the JD, instead of only the verbatim JD phrase.
// Score = (Σ weights of present keywords) / (Σ all weights), as a 0–100 integer.
// The SAME function scores the original and the refined resume, so they're comparable.
function termInText(term, lowerText) {
  const kw = String(term || "").trim().toLowerCase();
  if (!kw) return false;
  // Escape regex metachars, allow flexible whitespace between words, and accept an
  // optional trailing "s" (plural) when the term ends in a letter.
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const plural = /[a-z]$/.test(kw) ? "s?" : "";
  // Boundaries so "java" doesn't match inside "javascript", while "C++" / ".NET" still match.
  const re = new RegExp(`(?<![a-z0-9])${escaped}${plural}(?![a-z0-9])`, "i");
  return re.test(lowerText);
}

function keywordPresent(matchTerms, lowerText) {
  return matchTerms.some((t) => termInText(t, lowerText));
}

// Bare single-word tokens that are too generic to be distinctive of any one skill —
// they appear in unrelated resume contexts and cause false "present" matches. The
// extraction prompt forbids the model from emitting these as standalone matchTerms,
// but the model isn't perfectly reliable, so we also strip them deterministically.
// Multi-word terms containing one of these (e.g. "team leadership") are unaffected.
const FORBIDDEN_GENERIC_MATCH_TERMS = new Set([
  "data", "strategy", "strategic", "team", "work", "management", "analysis",
  "analytics", "support", "lead", "metrics", "planning", "experience",
]);

export function scoreResume(resumeText, keywords) {
  const lower = String(resumeText || "").toLowerCase();
  let total = 0;
  let matched = 0;
  const present = new Set();
  for (const k of keywords) {
    total += k.weight;
    if (keywordPresent(k.matchTerms, lower)) {
      matched += k.weight;
      present.add(k.keyword);
    }
  }
  return { score: total > 0 ? Math.round((matched / total) * 100) : 0, present };
}

// Runs the full analysis: extract weighted keywords, refine the resume, and compute
// the deterministic before/after scores. Returns either { ok: true, ... } with the
// client-facing `result` plus internal `rawKeywords` / `before` / `after` (handy for
// tests and diagnostics), or { ok: false, status, body } describing the failure.
// POST is a thin wrapper around this.
export async function analyzeResume(resume, jobDesc) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("refine-resume: ANTHROPIC_API_KEY is not set");
    return { ok: false, status: 500, body: { error: "Server misconfiguration: missing API key" } };
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) optimization specialist and professional resume writer. A job seeker has pasted their resume and a job description. Extract the keywords the role screens for and produce concrete, honest improvements to the resume.

ABSOLUTE RULE — NEVER FABRICATE:
You must NEVER invent, exaggerate, or assume any experience, employer, job title, credential, certification, degree, skill, tool, metric, percentage, dollar figure, team size, date, or outcome that is not already explicitly present in the candidate's original resume. You may only rephrase, reorganize, surface, and emphasize what is genuinely there. If a job requirement is not supported by the resume, mark the corresponding keyword "unsupported" — do not write it into a bullet or the refined resume as if the candidate has it. Where adding a real metric would strengthen a bullet but none exists in the resume, use a clearly bracketed placeholder such as [X%] or [X] for the candidate to fill in with their own true number — never a fabricated value.

ABSOLUTE RULE — NEVER ALTER JOB TITLES, EMPLOYERS, OR DATES:
Copy every job title, company/employer name, and employment date range VERBATIM from the original resume. Do not upgrade, embellish, modernize, seniority-bump, or otherwise "promote" them — for example, never turn "Recruiter" into "Principal Technical Recruiter." The headline/summary line under the candidate's name may only use wording that appears in, or is directly and obviously supported by, the original resume — no inflated or aspirational titles.

Return your answer as a SINGLE valid JSON object and NOTHING else — no markdown code fences, no commentary before or after. Use exactly this shape:

{
  "keywords": [
    { "keyword": "<short core skill/term>", "matchTerms": ["<term>", "<synonym>"], "weight": <1 | 2 | 3>, "eligibility": "present" | "addable" | "unsupported" }
  ],
  "bulletImprovements": [
    { "original": "<the relevant line/phrase from the candidate's real resume, or a short note like 'New bullet from existing experience' if drawn from described experience>", "improved": "<stronger ATS-optimized rewrite grounded only in what the resume already shows>" }
  ],
  "fullResume": "<the candidate's complete resume, refined: same real facts, identical job titles/employers/dates, but with stronger action verbs, naturally woven-in keywords the candidate genuinely qualifies for, cleaner structure, and ATS-friendly formatting. Use plain text with line breaks. Do NOT add any experience, role, or credential not in the original.>"
}

Requirements:
- "keywords": extract 12 to 16 of the most important skills, tools, and qualifications the JOB DESCRIPTION screens for. For each:
  - "keyword": the SHORTEST matchable unit a real resume would actually contain — the core skill noun, NOT a full JD phrase or boilerplate. Strip filler. Examples: "data-driven decision-making" -> "data-driven"; "partnership with senior leadership" -> "senior leadership"; "proven track record of full-cycle recruiting" -> "full-cycle recruiting". Extract the concept, not the JD's sentence.
  - "matchTerms": 1 to 4 SPECIFIC terms that should each count as this keyword being PRESENT if they appear in a resume — the keyword itself plus tight synonyms, common abbreviations, and the distinctive MULTI-WORD head term. HARD RULE: every match term must be distinctive to THIS skill. NEVER include a bare generic single word that also appears in unrelated resume contexts — forbidden on their own: "data", "strategy", "strategic", "team", "work", "management", "analysis", "analytics", "support", "lead", "metrics", "planning", "experience". Spell out the distinctive phrase instead of a generic stem. Examples: "ATS" -> ["ATS", "applicant tracking system"]; "senior leadership" -> ["senior leadership", "executives", "leadership team"]; "data-driven" -> ["data-driven", "data-informed", "data-driven decision"] (NEVER bare "data" or "analytics"); "strategic thinking" -> ["strategic thinking", "strategic planning"] (NEVER bare "strategy" or "strategic"). A match term of two or more words is almost always safer than a single word.
  - "weight": how central it is to the role — 3 = core/required, 2 = important, 1 = nice-to-have.
  - "eligibility": judged against the ORIGINAL resume —
    - "present" if the original resume already clearly demonstrates it,
    - "addable" if the candidate's real experience genuinely supports it even though it is not yet stated (you should weave these into the refined resume),
    - "unsupported" if the candidate's background does not support it (do NOT add these).
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
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    console.error("refine-resume: network error calling Anthropic:", err);
    return { ok: false, status: 502, body: { error: "Failed to reach Anthropic API", detail: String(err) } };
  }

  if (!anthropicResponse.ok) {
    const errBody = await anthropicResponse.text();
    console.error(`refine-resume: Anthropic returned ${anthropicResponse.status}:`, errBody);
    return { ok: false, status: 502, body: { error: `Anthropic API error ${anthropicResponse.status}`, detail: errBody } };
  }

  let data;
  try {
    data = await anthropicResponse.json();
  } catch (err) {
    return { ok: false, status: 502, body: { error: "Failed to parse Anthropic response", detail: String(err) } };
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
    return { ok: false, status: 502, body: { error: "Could not parse analysis. Please try again.", detail: String(err) } };
  }

  // Normalize / guard the shape so the client always gets safe defaults.
  const rawKeywords = Array.isArray(parsed.keywords)
    ? parsed.keywords
        .filter((k) => k && k.keyword)
        .map((k) => {
          const keyword = String(k.keyword);
          // Build the match-term set: AI-supplied synonyms/head terms, always including
          // the keyword itself, de-duped case-insensitively.
          const supplied = Array.isArray(k.matchTerms)
            ? k.matchTerms.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim())
            : [];
          const matchTerms = [];
          const seen = new Set();
          for (const t of [keyword, ...supplied]) {
            const key = t.toLowerCase();
            if (seen.has(key)) continue;
            // Drop bare generic tokens the model emitted despite the prompt rule.
            // Never drop the keyword itself, so a keyword always keeps at least one term.
            if (t !== keyword && FORBIDDEN_GENERIC_MATCH_TERMS.has(key)) continue;
            seen.add(key);
            matchTerms.push(t);
          }
          return {
            keyword,
            matchTerms,
            weight: [1, 2, 3].includes(k.weight) ? k.weight : 2,
            eligibility: ["present", "addable", "unsupported"].includes(k.eligibility)
              ? k.eligibility
              : "unsupported",
          };
        })
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

  return { ok: true, result, rawKeywords, before, after };
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

  const outcome = await analyzeResume(resume, jobDesc);
  if (!outcome.ok) {
    return Response.json(outcome.body, { status: outcome.status });
  }
  return Response.json(outcome.result);
}
