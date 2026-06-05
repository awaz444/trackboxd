import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get("id");

  if (!albumId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const { data: currentAlbum } = await supabase
      .from("spotify_items")
      .select("id, genres, artist, like_count, review_count")
      .eq("id", albumId)
      .single();

    if (!currentAlbum) {
      return NextResponse.json([]);
    }

    const genres: string[] = currentAlbum.genres ?? [];
    const artist: string = currentAlbum.artist ?? "";

    let similar: any[] = [];

    if (genres.length > 0) {
      const { data: byGenre } = await supabase
        .from("spotify_items")
        .select(
          "id, name, artist, cover_url, avg_rating, like_count, review_count"
        )
        .eq("type", "album")
        .neq("id", albumId)
        .overlaps("genres", genres)
        .order("like_count", { ascending: false })
        .limit(10);

      similar = byGenre || [];
    }

    if (similar.length < 5 && artist) {
      const { data: byArtist } = await supabase
        .from("spotify_items")
        .select(
          "id, name, artist, cover_url, avg_rating, like_count, review_count"
        )
        .eq("type", "album")
        .neq("id", albumId)
        .ilike("artist", `%${artist.split(",")[0].trim()}%`)
        .order("like_count", { ascending: false })
        .limit(10);

      const existingIds = new Set(similar.map((a) => a.id));
      (byArtist || []).forEach((a) => {
        if (!existingIds.has(a.id)) {
          similar.push(a);
          existingIds.add(a.id);
        }
      });
    }

    const scored = similar
      .map((a) => ({
        ...a,
        score: (a.like_count || 0) * 2 + (a.review_count || 0) * 3,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json(scored);
  } catch (error) {
    console.error("similar albums error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
