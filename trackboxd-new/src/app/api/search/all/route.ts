import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { searchTracksAlbumsAndPlaylists } from "@/lib/spotify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const trackLimit = Number(searchParams.get("trackLimit") || 2);
    const albumLimit = Number(searchParams.get("albumLimit") || 1);
    const playlistLimit = Number(searchParams.get("playlistLimit") || 1);
    const userLimit = Number(searchParams.get("userLimit") || 2);
    const market = searchParams.get("market") || undefined;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Spotify search
    const [spotify] = await Promise.all([
      searchTracksAlbumsAndPlaylists(query, {
        trackLimit,
        albumLimit,
        playlistLimit,
        market,
      }),
    ]);

    // Users search (by name)
    const supabase = createClient(cookies());
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, image_url, country")
      .ilike("name", `%${query}%`)
      .limit(userLimit);

    if (usersError) {
      console.error("User search error:", usersError);
    }

    return NextResponse.json({
      tracks: spotify.tracks || [],
      albums: spotify.albums || [],
      playlists: spotify.playlists || [],
      users: users || [],
    });
  } catch (error) {
    console.error("Search-all API error:", error);
    return NextResponse.json(
      {
        error: "Failed to search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}


