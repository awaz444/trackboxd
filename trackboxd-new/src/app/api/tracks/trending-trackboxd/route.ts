import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    // 7-day rolling window — avoids the Mon=empty problem of Mon–Sun windows
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch track likes, reviews, and annotations from the past 7 days in parallel
    const [likeResult, reviewResult, annotationResult] = await Promise.all([
      supabase
        .from("likes")
        .select("target_id")
        .eq("target_type", "track")
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("reviews")
        .select("item_id, spotify_items!reviews_item_id_fkey(type)")
        .eq("is_public", true)
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("annotations")
        .select("track_id")
        .eq("is_public", true)
        .gte("created_at", sevenDaysAgo),
    ]);

    // Aggregate activity counts per track ID
    const activityCounts: Record<string, number> = {};

    (likeResult.data || []).forEach((l) => {
      activityCounts[l.target_id] = (activityCounts[l.target_id] || 0) + 1;
    });

    // Only count reviews where the item is a track
    (reviewResult.data || []).forEach((r: any) => {
      const si = Array.isArray(r.spotify_items)
        ? r.spotify_items[0]
        : r.spotify_items;
      if (si?.type === "track") {
        activityCounts[r.item_id] = (activityCounts[r.item_id] || 0) + 1;
      }
    });

    (annotationResult.data || []).forEach((a) => {
      activityCounts[a.track_id] = (activityCounts[a.track_id] || 0) + 1;
    });

    if (Object.keys(activityCounts).length === 0) {
      return NextResponse.json([]);
    }

    // Take top 5 track IDs by activity count
    const topTrackIds = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Fetch full track metadata from spotify_items
    const { data: tracks } = await supabase
      .from("spotify_items")
      .select(
        "id, name, artist, cover_url, spotify_url, like_count, review_count, annotation_count, avg_rating"
      )
      .eq("type", "track")
      .in("id", topTrackIds);

    // Restore activity-count sort order
    const trackMap = new Map((tracks || []).map((t: any) => [t.id, t]));
    const sorted = topTrackIds
      .map((id) => ({
        ...(trackMap.get(id) || {}),
        activity_count: activityCounts[id] || 0,
      }))
      .filter((t) => t.id);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("trending-trackboxd error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
