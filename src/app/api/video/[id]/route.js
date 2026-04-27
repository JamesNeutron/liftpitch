import { createClient } from "@supabase/supabase-js";

// Public route — no auth required; videos table has `using (true)` select policy.
// Using maybeSingle() instead of single() so PostgREST never returns 406:
//   single()      → 406 when row count != 1 (breaks Safari)
//   maybeSingle() → null data when 0 rows, error only on >1 row
export async function GET(_request, { params }) {
  const { id } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("videos")
    .select("id, r2_url, mp4_url, transcoded, verification_hash, created_at, share_link")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  return Response.json(data);
}
