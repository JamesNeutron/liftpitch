export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { gaps } = body;
  if (!Array.isArray(gaps) || !gaps.length) {
    return Response.json({ error: "Missing gaps" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const prompt = `Convert these resume gap descriptions into clear, friendly yes/no questions for a job seeker. Return ONLY a JSON array of strings, one question per gap, in the same order. No markdown, no code fences, no other text — just the raw JSON array.
Gaps: ${JSON.stringify(gaps)}`;

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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    return Response.json({ error: "Failed to reach Anthropic API", detail: String(err) }, { status: 502 });
  }

  if (!anthropicResponse.ok) {
    const errBody = await anthropicResponse.text();
    return Response.json({ error: `Anthropic API error ${anthropicResponse.status}`, detail: errBody }, { status: 502 });
  }

  const data = await anthropicResponse.json();
  const rawText = data.content?.map(b => b.text || "").join("") || "";
  // Strip markdown code fences the model may wrap around the JSON
  const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  let questions;
  try {
    questions = JSON.parse(text);
    if (!Array.isArray(questions) || questions.length !== gaps.length) throw new Error("shape mismatch");
  } catch {
    return Response.json({ error: "Failed to parse questions" }, { status: 500 });
  }

  return Response.json({ questions });
}
