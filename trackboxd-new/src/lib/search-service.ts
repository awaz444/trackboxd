import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { searchTracksAlbumsAndPlaylists } from "@/lib/spotify";

export interface SearchResults {
  tracks: any[];
  albums: any[];
  playlists: any[];
  users: any[];
}

export interface SearchOptions {
  trackLimit?: number;
  albumLimit?: number;
  playlistLimit?: number;
  userLimit?: number;
  market?: string;
}

export async function searchAll(query: string, options: SearchOptions = {}): Promise<SearchResults> {
  const {
    trackLimit = 2,
    albumLimit = 1,
    playlistLimit = 1,
    userLimit = 2,
    market,
  } = options;

  if (!query || !query.trim()) {
    return { tracks: [], albums: [], playlists: [], users: [] };
  }

  try {
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

    return {
      tracks: spotify.tracks || [],
      albums: spotify.albums || [],
      playlists: spotify.playlists || [],
      users: users || [],
    };
  } catch (error) {
    console.error("Search service error:", error);
    throw error;
  }
}
