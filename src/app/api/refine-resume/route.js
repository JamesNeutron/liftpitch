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

  const prompt = `You are an expert ATS (Applicant Tracking System) optimization specialist and professional resume writer. A job seeker has pasted their resume and a job description. Analyze how well the resume matches the role and produce concrete, honest improvements.

ABSOLUTE RULE — NEVER FABRICATE:
You must NEVER invent, exaggerate, or assume any experience, employer, job title, credential, certification, degree, skill, tool, metric, percentage, dollar figure, team size, date, or outcome that is not already explicitly present in the candidate's original resume. You may only rephrase, reorganize, surface, and emphasize what is genuinely there. If a job requirement is not supported by the resume, treat the corresponding keyword as "missing" — do not write it into a bullet or the refined resume as if the candidate has it. Where adding a real metric would strengthen a bullet but none exists in the resume, use a clearly bracketed placeholder such as [X%] or [X] for the candidate to fill in with their own true number — never a fabricated value.

Return your answer as a SINGLE valid JSON object and NOTHING else — no markdown code fences, no commentary before or after. Use exactly this shape:

{
  "matchScore": <integer 0-100, honest estimate of how well the resume currently matches the job description>,
  "keywords": [
    { "keyword": "<important skill/term from the job description>", "status": "found" | "partial" | "missing" }
  ],
  "bulletImprovements": [
    { "original": "<the relevant line/phrase from the candidate's real resume, or a short note like 'New bullet from existing experience' if drawn from described experience>", "improved": "<stronger ATS-optimized rewrite grounded only in what the resume already shows>" }
  ],
  "fullResume": "<the candidate's complete resume, refined: same real facts, but with stronger action verbs, naturally woven-in keywords the candidate genuinely qualifies for, cleaner structure, and ATS-friendly formatting. Use plain text with line breaks. Do NOT add any experience, role, or credential not in the original.>"
}

Requirements:
- "keywords": extract 12 to 16 of the most important keywords, skills, tools, and qualifications from the JOB DESCRIPTION. Mark each:
  - "found" if the resume clearly demonstrates it,
  - "partial" if the resume shows related/adjacent experience but not an exact match,
  - "missing" if the resume does not support it at all.
- "bulletImprovements": provide 3 to 4 rewritten bullet points. Each must be grounded strictly in the candidate's real experience from their resume — stronger verbs, clearer impact, relevant keywords they truly qualify for. Never add achievements they didn't state.
- "fullResume": rewrite the entire resume applying the improvements. Keep every real fact. Only reorganize, sharpen wording, and incorporate keywords the candidate legitimately qualifies for.

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
  const result = {
    matchScore: typeof parsed.matchScore === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.matchScore)))
      : 0,
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter((k) => k && k.keyword)
          .map((k) => ({
            keyword: String(k.keyword),
            status: ["found", "partial", "missing"].includes(k.status) ? k.status : "missing",
          }))
      : [],
    bulletImprovements: Array.isArray(parsed.bulletImprovements)
      ? parsed.bulletImprovements
          .filter((b) => b && b.improved)
          .map((b) => ({ original: String(b.original || ""), improved: String(b.improved) }))
      : [],
    fullResume: typeof parsed.fullResume === "string" ? parsed.fullResume : "",
  };

  return Response.json(result);
}
