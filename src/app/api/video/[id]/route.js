import { createClient } from "@supabase/supabase-js";

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
      .select("id, r2_url, mp4_url, stream_uid, transcoded, verification_hash, created_at, share_link, user_id, ip_location, is_sponsored")
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

    const { user_id, is_sponsored, ...videoData } = data;
    return Response.json({
      ...videoData,
      mp4_url: data.mp4_url ?? null,
      is_free_tier,
    });
  } catch (err) {
    console.error('[video-api] Unhandled error:', err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
