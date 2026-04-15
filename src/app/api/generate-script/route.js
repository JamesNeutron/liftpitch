export async function POST(request) {
  const { resume, jobDesc, bio, duration } = await request.json();

  if (!resume || !jobDesc || !bio) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const wordRange =
    duration === "30" ? "75-90" : duration === "45" ? "110-135" : "150-180";

  const prompt = `You are an expert career coach and hiring strategist. A job seeker wants to record a ${duration}-second video pitch targeted at a specific role. Analyze their resume against the job description and write a compelling video script that draws direct connections between their experience and what the employer needs.

First, output a JSON block wrapped in <analysis> tags:
<analysis>
{
  "matchScore": 0-100,
  "strongMatches": ["match 1", "match 2", "match 3"],
  "gapsToBridge": ["gap 1"],
  "angleToPlay": "one sentence best pitch angle"
}
</analysis>

Then write the script. It should:
- Be ${wordRange} words for ${duration}-second delivery
- Open by naming the role and company if mentioned in the job description
- Draw 2-3 direct parallels between their experience and job requirements
- Incorporate personality and unique traits from their about me section
- Address gaps by reframing as transferable strengths
- Sound natural, confident, enthusiastic — not robotic
- End with a strong close that makes the hiring manager want to meet them
- Use first person

RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

ABOUT ME:
${bio}

Output <analysis> JSON first, then ONLY the script text (no labels or prefix).`;

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.text();
    console.error("Anthropic API error:", err);
    return Response.json({ error: "Anthropic API error" }, { status: 502 });
  }

  const data = await anthropicResponse.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";

  return Response.json({ text });
}
