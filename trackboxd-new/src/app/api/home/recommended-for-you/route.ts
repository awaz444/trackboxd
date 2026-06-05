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

    // Step 1: Get user's top 5 genres by weight
    const { data: interests } = await supabase
      .from("user_interests")
      .select("genre")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(5);

    if (!interests || interests.length === 0) {
      // No interest profile yet — return empty (frontend falls back to Popular)
      return NextResponse.json([]);
    }

    const topGenres = interests.map((i) => i.genre);

    // Step 2: Get items already interacted with by this user (to exclude)
    const [likedResult, reviewedResult] = await Promise.all([
      supabase
        .from("likes")
        .select("target_id")
        .eq("user_id", user.id)
        .in("target_type", ["track", "album"]),
      supabase
        .from("reviews")
        .select("item_id")
        .eq("user_id", user.id),
    ]);

    const interactedIds = new Set([
      ...(likedResult.data || []).map((l) => l.target_id),
      ...(reviewedResult.data || []).map((r) => r.item_id),
    ]);

    // Step 3: Find items with overlapping genres
    // Supabase supports array overlap using the `cs` (contains) or `ov` operators
    const { data: candidates } = await supabase
      .from("spotify_items")
      .select(
        "id, type, name, artist, cover_url, spotify_url, like_count, review_count, annotation_count, avg_rating, genres"
      )
      .in("type", ["track", "album"])
      .overlaps("genres", topGenres)
      .order("like_count", { ascending: false })
      .limit(50);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json([]);
    }

    // Step 4: Filter out already-interacted items, score, return top 5
    const recommendations = candidates
      .filter((item) => !interactedIds.has(item.id))
      .map((item) => ({
        ...item,
        score:
          item.type === "track"
            ? (item.like_count || 0) * 2 +
              (item.review_count || 0) * 3 +
              (item.annotation_count || 0) * 2
            : (item.like_count || 0) * 2 + (item.review_count || 0) * 3,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("recommended-for-you error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
