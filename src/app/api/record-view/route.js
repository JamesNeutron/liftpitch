import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let videoId;
  try {
    ({ videoId } = await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!videoId) {
    return Response.json({ error: "Missing videoId" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error: fetchError } = await supabase
    .from("videos")
    .select("total_views, daily_views")
    .eq("id", videoId)
    .single();

  if (fetchError) {
    console.error("[record-view] Fetch error:", fetchError.message);
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dailyViews = data.daily_views || {};
  dailyViews[today] = (dailyViews[today] || 0) + 1;

  const { error: updateError } = await supabase
    .from("videos")
    .update({
      total_views: (data.total_views || 0) + 1,
      daily_views: dailyViews,
    })
    .eq("id", videoId);

  if (updateError) {
    console.error("[record-view] Update error:", updateError.message);
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
