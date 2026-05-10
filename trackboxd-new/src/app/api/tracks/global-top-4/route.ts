import { getPlaylistItems } from '@/lib/spotify';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SpotifyPlaylistTrack } from '@/app/tracks/types';

export async function GET() {
  const playlistId = '5FN6Ego7eLX6zHuCMovIR2';
  
  try {
    // 1. Get tracks from Spotify
    const response = await getPlaylistItems(playlistId, 4);
    const tracks = response.items;
    const trackIds = tracks.map((t: SpotifyPlaylistTrack) => t.track.id);

    // 2. Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 3. Get all stats in one query
    const { data: stats, error } = await supabase
      .from('spotify_items')
      .select('*')
      .in('id', trackIds);

    if (error) {
      console.error('Supabase error:', error);
      // Continue with default stats instead of failing completely
    }

    // 4. Merge data
    const enrichedTracks = tracks.map((trackItem: SpotifyPlaylistTrack) => {
      const trackStats = stats?.find(s => s.id === trackItem.track.id) || {
        like_count: 0,
        review_count: 0,
        annotation_count: 0,
        avg_rating: 0
      };

      return {
        ...trackItem,
        track: {
          ...trackItem.track,
          stats: {
            like_count: trackStats.like_count,
            review_count: trackStats.review_count,
            annotation_count: trackStats.annotation_count,
            avg_rating: trackStats.avg_rating
          }
        }
      };
    });

    return NextResponse.json(enrichedTracks);

  } catch (error) {
    console.error('Failed to fetch playlist tracks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch playlist tracks',
        details: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}