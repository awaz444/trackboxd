import { getServerUser } from "@/lib/supabase/get-server-user";
import { getTrackDetails } from "@/lib/spotify";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


// Workaround for Next.js 13 App Router limitation
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { song_id: string } }
) {

  const user = await getServerUser();

  if (!user) {
      return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
      );
  }


  try {
    const param = await params;
    const trackId = param.song_id;

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    // 1. Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 2. Get stats (and cached metadata) from Supabase
    const { data: stats, error: supabaseError } = await supabase
      .from('spotify_items')
      .select('*')
      .eq('id', trackId)
      .single();

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      // Continue with default stats if Supabase query fails
    }

    // 3. Get track details. If we already have cached metadata for this
    // track (written the first time it was viewed, reviewed, annotated, or
    // liked), serve from that cache and skip the Spotify call entirely — a
    // track page shouldn't need to hit Spotify's live API on every load.
    const hasCachedMetadata = !!(stats && stats.name && stats.artist);

    let trackDetails: any;
    if (hasCachedMetadata) {
      trackDetails = {
        id: trackId,
        name: stats.name,
        artists: [{ name: stats.artist }],
        album: {
          name: stats.album || "Unknown Album",
          images: stats.cover_url ? [{ url: stats.cover_url }] : [],
          release_date: null,
        },
        duration_ms: stats.duration_ms || 0,
        external_urls: { spotify: stats.spotify_url || null },
      };
    } else {
      // No cache yet — this is the first time this track has been viewed.
      // Fetch it live from Spotify once, and cache the result so every
      // subsequent load (and any Spotify catalog changes afterward) is
      // unaffected.
      try {
        const liveTrack = await getTrackDetails(trackId);
        trackDetails = liveTrack;

        const cacheRow = {
          id: trackId,
          type: "track",
          name: liveTrack.name,
          artist: liveTrack.artists?.map((a: any) => a.name).join(", "),
          album: liveTrack.album?.name,
          duration_ms: liveTrack.duration_ms,
          cover_url: liveTrack.album?.images?.[0]?.url ?? null,
          spotify_url: liveTrack.external_urls?.spotify,
        };
        // Best-effort cache write — a failure here (e.g. a concurrent
        // interaction already inserted the row) shouldn't fail the page.
        const { error: cacheError } = await supabase
          .from('spotify_items')
          .upsert(cacheRow, { onConflict: 'id' });
        if (cacheError) console.error('Failed to cache track metadata:', cacheError);
      } catch (error) {
        const status = (error as Error & { status?: number }).status;
        if (status === 404) {
          return NextResponse.json(
            { error: "Track not found" },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // 4. Merge data
    const enrichedTrack = {
      ...trackDetails,
      stats: stats || {
        like_count: 0,
        review_count: 0,
        annotation_count: 0,
        avg_rating: 0
      }
    };

    return NextResponse.json(enrichedTrack);

  } catch (error) {
    console.error("Failed to fetch track details:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: "Failed to fetch track details",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}