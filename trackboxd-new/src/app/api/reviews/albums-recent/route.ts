import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    let query = supabase
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
      .order("created_at", { ascending: false })
      .limit(4);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: reviews, error } = await query;
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
    console.error("GET albums-recent reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch recent album reviews" }, { status: 500 });
  }
}
