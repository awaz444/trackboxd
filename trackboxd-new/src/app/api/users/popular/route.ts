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

    // Query 1: Fetch 50 most recently created users
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, image_url")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!users || users.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = users.map((u) => u.id);

    // Query 2–4 in parallel: follower counts, review stats, annotation stats, current user follows
    const [followerResult, reviewResult, annotationResult, myFollowsResult] = await Promise.all([
      supabase
        .from("follows")
        .select("following_id")
        .in("following_id", userIds)
        .eq("accepted", true),
      supabase
        .from("reviews")
        .select("user_id, like_count")
        .in("user_id", userIds)
        .eq("is_public", true),
      supabase
        .from("annotations")
        .select("user_id, like_count")
        .in("user_id", userIds)
        .eq("is_public", true),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", userIds),
    ]);

    // Aggregate follower counts
    const followerCounts: Record<string, number> = {};
    (followerResult.data || []).forEach((f) => {
      followerCounts[f.following_id] = (followerCounts[f.following_id] || 0) + 1;
    });

    // Aggregate review stats
    const reviewStats: Record<string, { count: number; likes: number }> = {};
    (reviewResult.data || []).forEach((r) => {
      if (!reviewStats[r.user_id]) reviewStats[r.user_id] = { count: 0, likes: 0 };
      reviewStats[r.user_id].count++;
      reviewStats[r.user_id].likes += r.like_count || 0;
    });

    // Aggregate annotation stats
    const annotationStats: Record<string, { count: number; likes: number }> = {};
    (annotationResult.data || []).forEach((a) => {
      if (!annotationStats[a.user_id]) annotationStats[a.user_id] = { count: 0, likes: 0 };
      annotationStats[a.user_id].count++;
      annotationStats[a.user_id].likes += a.like_count || 0;
    });

    const myFollowingIds = new Set((myFollowsResult.data || []).map((f) => f.following_id));

    // Score each user: followers×1 + review_likes×3 + annotation_likes×3 + review_count×1 + annotation_count×1
    const scored = users
      .map((u) => ({
        ...u,
        followers: followerCounts[u.id] || 0,
        review_count: reviewStats[u.id]?.count || 0,
        annotation_count: annotationStats[u.id]?.count || 0,
        is_following: myFollowingIds.has(u.id),
        score:
          (followerCounts[u.id] || 0) * 1 +
          (reviewStats[u.id]?.likes || 0) * 3 +
          (annotationStats[u.id]?.likes || 0) * 3 +
          (reviewStats[u.id]?.count || 0) * 1 +
          (annotationStats[u.id]?.count || 0) * 1,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json(scored);
  } catch (error) {
    console.error("popular users error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
