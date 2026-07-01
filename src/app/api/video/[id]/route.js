import { createClient } from "@supabase/supabase-js";
import { DEFAULT_BRAND_COLOR, DEFAULT_ACCENT_COLOR } from "../../../../lib/color";

// Server-side route — uses service role key to bypass RLS.
// Using maybeSingle() instead of single() so PostgREST never returns 406:
//   single()      → 406 when row count != 1 (breaks Safari)
//   maybeSingle() → null data when 0 rows, error only on >1 row
export async function GET(request, { params }) {
  try {
    const { id } = params;

    console.log('[video-api] Looking up ID:', id);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("videos")
      .select("id, r2_url, mp4_url, stream_uid, transcoded, verification_hash, created_at, share_link, user_id, ip_location, is_sponsored, role_id, candidate_name, company_name, role_name, question_1, question_2")
      .eq("id", id)
      .maybeSingle();

    console.log('[video-api] Supabase result:', JSON.stringify(data));
    console.log('[video-api] Supabase error:', JSON.stringify(error));

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: "Video not found" }, { status: 404 });
    }

    // Sponsored (accountless) rows have no owner profile and never carry a
    // watermark — force the no-watermark path and skip the plan lookup.
    // Non-sponsored playback: owner's plan decides watermark as before.
    let is_free_tier;
    if (data.is_sponsored) {
      is_free_tier = false;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.user_id)
        .maybeSingle();
      is_free_tier = profile?.plan !== "pro" && profile?.plan !== "lifetime";
    }

    // Strip every owner/sponsored-only column out of the base payload. The
    // non-sponsored response is exactly what it was before Stage 4; the extra
    // sponsored fields are re-added below only when the row is sponsored.
    const {
      user_id, is_sponsored, role_id,
      candidate_name, company_name, role_name, question_1, question_2,
      ...videoData
    } = data;

    const base = {
      ...videoData,
      mp4_url: data.mp4_url ?? null,
      is_free_tier,
    };

    if (!is_sponsored) {
      return Response.json(base);
    }

    // Sponsored recruiter page needs the employer's colors. Resolve them from
    // the originating role; if the role was deleted (role_id null / missing),
    // fall back to the app defaults so the page still renders on-brand.
    let brand_color = DEFAULT_BRAND_COLOR;
    let accent_color = DEFAULT_ACCENT_COLOR;
    if (role_id) {
      const { data: role } = await supabase
        .from("roles")
        .select("brand_color, accent_color")
        .eq("id", role_id)
        .maybeSingle();
      if (role) {
        brand_color = role.brand_color || DEFAULT_BRAND_COLOR;
        accent_color = role.accent_color || DEFAULT_ACCENT_COLOR;
      }
    }

    // Deliberately omit candidate_email, user_id, and consent fields — a
    // recruiter viewing /v never receives the candidate's private contact or
    // consent metadata.
    return Response.json({
      ...base,
      sponsored: true,
      candidate_name,
      company_name,
      role_name,
      question_1,
      question_2,
      brand_color,
      accent_color,
    });
  } catch (err) {
    console.error('[video-api] Unhandled error:', err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
