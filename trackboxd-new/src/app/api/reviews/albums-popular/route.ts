import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function GET() {
  // Public reviews only (is_public below), shown on /albums to everyone.

  try {
    const supabase = createPublicClient();

    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        text,
        created_at,
        user_id,
        item_id,
        is_public,
        like_count,
        spotify_items!inner (id, type, name, artist, cover_url),
        users:user_id (id, name, image_url)
      `)
      .eq("spotify_items.type", "album")
      .eq("is_public", true)
      .gte("created_at", fourteenDaysAgo)
      .order("like_count", { ascending: false })
      .limit(5);

    if (error) throw error;

    const formatted = (reviews || []).map((r: any) => ({
      ...r,
      item: {
        id: r.spotify_items?.id,
        name: r.spotify_items?.name,
        artist: r.spotify_items?.artist,
        album: null,
        cover_url: r.spotify_items?.cover_url,
        type: "album",
      },
      spotify_items: undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET albums-popular reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch popular album reviews" }, { status: 500 });
  }
}
