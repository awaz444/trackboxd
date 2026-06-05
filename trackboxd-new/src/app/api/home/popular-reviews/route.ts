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

    // 14-day rolling window (not Mon–Sun) — better for low-traction platforms
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        text,
        like_count,
        created_at,
        item_id,
        spotify_items!reviews_item_id_fkey (
          id,
          type,
          name,
          artist,
          cover_url,
          spotify_url
        ),
        users!reviews_user_id_fkey (
          id,
          name,
          image_url,
          username
        )
      `)
      .eq("is_public", true)
      .gte("created_at", fourteenDaysAgo)
      .order("like_count", { ascending: false })
      .limit(5);

    if (error) throw error;

    const formatted = (reviews || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      like_count: r.like_count,
      created_at: r.created_at,
      item_id: r.item_id,
      item_type: r.spotify_items?.type,
      item_name: r.spotify_items?.name,
      artist: r.spotify_items?.artist,
      cover_url: r.spotify_items?.cover_url,
      spotify_url: r.spotify_items?.spotify_url,
      user: {
        id: r.users?.id,
        name: r.users?.name,
        image_url: r.users?.image_url,
        username: r.users?.username,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("popular-reviews error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
