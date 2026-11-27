import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getRequestUser } from "@/lib/supabase/request-user";
import { getContentAccess } from "@/lib/supabase/content-access";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Public reviews only (is_public below), shown on /albums to everyone.

  try {
    const supabase = createPublicClient();

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
      // Nothing from a private profile the viewer doesn't follow. The viewer
      // is only read here so the unfiltered list stays cookie-free.
      const viewer = await getRequestUser(req);
      const access = await getContentAccess(supabase, userId, viewer?.id);
      if (!access.canView) {
        return NextResponse.json([]);
      }
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
