import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { gapExperiences, scriptId } = body;
  if (!gapExperiences?.length) {
    return Response.json({ error: "Missing gapExperiences" }, { status: 400 });
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const isPaid = profile?.plan === "pro" || profile?.plan === "lifetime";
  if (!isPaid) {
    // Free users get one use — tracked by checking for any saved resume_bullets
    const { count } = await supabase
      .from("scripts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("resume_bullets", "is", null);
    if ((count ?? 0) >= 1) {
      return Response.json({ error: "Free resume strengthening already used. Upgrade to Pro for unlimited access." }, { status: 403 });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
  }

  const experienceText = gapExperiences
    .map(({ gap, desc }) => `Gap: ${gap}\nExperience: ${desc}`)
    .join("\n\n");

  const prompt = `You are an expert resume writer and ATS optimization specialist. A job seeker has identified skill gaps for a role they're applying to. They have relevant experience for these gaps and need polished, ATS-friendly resume bullet points.

For each gap below, write 1-2 strong resume bullet points that:
- Start with a powerful action verb
- Include relevant keywords from the gap for ATS
- Are concise (under 2 lines each)
- Format each bullet exactly as: "• [Action verb] [specific achievement with context and impact]"

IMPORTANT — do NOT invent specific numbers, percentages, revenue figures, team sizes, or geographic details. Where a metric or specific detail would strengthen the bullet, use a bracketed placeholder instead, for example: [X%], [X users], [X team members], [region], [$X], [X months]. The job seeker will replace placeholders with their real figures before adding to their resume.

${experienceText}

Output ONLY the bullet points, one per line, with the • character prefix. No headers, no labels, no explanations.`;

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
        max_tokens: 1000,
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
  const text = data.content?.map(b => b.text || "").join("") || "";

  const bullets = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("•") || l.startsWith("-"))
    .map(l => l.startsWith("-") ? "•" + l.slice(1) : l);

  if (scriptId) {
    await supabase
      .from("scripts")
      .update({ resume_bullets: bullets })
      .eq("id", scriptId)
      .eq("user_id", user.id);
  }

  return Response.json({ bullets });
}
