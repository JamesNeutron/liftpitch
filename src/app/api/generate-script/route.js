import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  let rawBody;
  try {
    rawBody = await request.text();
    console.log("generate-script: raw body (first 100 chars):", rawBody.slice(0, 100));
  } catch (err) {
    console.error("generate-script: failed to read request body:", err);
    return Response.json({ error: "Failed to read request body", detail: String(err) }, { status: 400 });
  }

  let resume, jobDesc, bio, duration;
  try {
    ({ resume, jobDesc, bio, duration } = JSON.parse(rawBody));
  } catch (err) {
    console.error("generate-script: failed to parse request body JSON:", err);
    return Response.json({ error: "Invalid request body JSON", detail: String(err) }, { status: 400 });
  }

  if (!resume || !jobDesc || !bio) {
    const missing = ["resume", "jobDesc", "bio"].filter((k) => !{ resume, jobDesc, bio }[k]);
    console.error("generate-script: missing required fields:", missing);
    return Response.json({ error: "Missing required fields", missing }, { status: 400 });
  }

  // Server-side free tier enforcement for authenticated users
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (profile?.plan !== "pro" && profile?.plan !== "lifetime") {
        const { count } = await supabase
          .from("scripts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        if ((count ?? 0) >= 1) {
          return Response.json({ error: "free_limit_reached" }, { status: 403 });
        }
      }
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("generate-script: ANTHROPIC_API_KEY is not set");
    return Response.json({ error: "Server misconfiguration: missing API key" }, { status: 500 });
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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    console.error("generate-script: network error calling Anthropic:", err);
    return Response.json({ error: "Failed to reach Anthropic API", detail: String(err) }, { status: 502 });
  }

  if (!anthropicResponse.ok) {
    const errBody = await anthropicResponse.text();
    console.error(
      `generate-script: Anthropic returned ${anthropicResponse.status}:`,
      errBody
    );
    return Response.json(
      { error: `Anthropic API error ${anthropicResponse.status}`, detail: errBody },
      { status: 502 }
    );
  }

  let data;
  try {
    data = await anthropicResponse.json();
  } catch (err) {
    console.error("generate-script: failed to parse Anthropic response JSON:", err);
    return Response.json({ error: "Failed to parse Anthropic response", detail: String(err) }, { status: 502 });
  }

  const text = data.content?.map((b) => b.text || "").join("") || "";
  console.log("generate-script: success, response length:", text.length);

  return Response.json({ text });
}
