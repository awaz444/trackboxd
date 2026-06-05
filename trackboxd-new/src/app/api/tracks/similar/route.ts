import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("id");

  if (!trackId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // Get the current track's genres and artist
    const { data: currentTrack } = await supabase
      .from("spotify_items")
      .select("id, genres, artist, like_count, review_count, annotation_count")
      .eq("id", trackId)
      .single();

    if (!currentTrack) {
      return NextResponse.json([]);
    }

    const genres: string[] = currentTrack.genres ?? [];
    const artist: string = currentTrack.artist ?? "";

    let similar: any[] = [];

    // Strategy 1: Genre overlap (if genres are stored)
    if (genres.length > 0) {
      const { data: byGenre } = await supabase
        .from("spotify_items")
        .select(
          "id, name, artist, cover_url, avg_rating, like_count, review_count, annotation_count"
        )
        .eq("type", "track")
        .neq("id", trackId)
        .overlaps("genres", genres)
        .order("like_count", { ascending: false })
        .limit(10);

      similar = byGenre || [];
    }

    // Strategy 2: Same artist (supplement or fallback)
    if (similar.length < 5 && artist) {
      const { data: byArtist } = await supabase
        .from("spotify_items")
        .select(
          "id, name, artist, cover_url, avg_rating, like_count, review_count, annotation_count"
        )
        .eq("type", "track")
        .neq("id", trackId)
        .ilike("artist", `%${artist.split(",")[0].trim()}%`)
        .order("like_count", { ascending: false })
        .limit(10);

      // Merge, deduplicate
      const existingIds = new Set(similar.map((t) => t.id));
      (byArtist || []).forEach((t) => {
        if (!existingIds.has(t.id)) {
          similar.push(t);
          existingIds.add(t.id);
        }
      });
    }

    // Score and return top 5
    const scored = similar
      .map((t) => ({
        ...t,
        score:
          (t.like_count || 0) * 2 +
          (t.review_count || 0) * 3 +
          (t.annotation_count || 0) * 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json(scored);
  } catch (error) {
    console.error("similar tracks error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
