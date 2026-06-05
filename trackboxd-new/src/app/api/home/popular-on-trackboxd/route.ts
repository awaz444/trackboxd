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

    // Fetch top 100 items by like_count from spotify_items (tracks and albums only)
    // then score in JS to avoid complex RPC
    const { data: items, error } = await supabase
      .from("spotify_items")
      .select(
        "id, type, name, artist, cover_url, spotify_url, like_count, review_count, annotation_count, avg_rating"
      )
      .in("type", ["track", "album"])
      .order("like_count", { ascending: false })
      .limit(100);

    if (error) throw error;

    const scored = (items || [])
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

    return NextResponse.json(scored);
  } catch (error) {
    console.error("popular-on-trackboxd error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
