import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTrackDetails } from '@/lib/spotify';
import { enrichItemGenres } from '@/lib/enrichGenres';

export async function POST(req: NextRequest) {
  return handleLikeRequest(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return handleLikeRequest(req, 'DELETE');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const trackId = searchParams.get('trackId');

  if (!userId || !trackId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data } = await supabase
      .from('likes')
      .select('id')
      .match({ user_id: userId, target_type: 'track', target_id: trackId })
      .single();

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('GET like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleLikeRequest(req: NextRequest, method: 'POST' | 'DELETE') {
  const { userId, trackId } = await req.json();

  if (!userId || !trackId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    if (method === 'POST') {
      // Step 1: Check if track already exists
      const { data: existingItem, error: fetchError } = await supabase
        .from('spotify_items')
        .select('id')
        .eq('id', trackId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = "no rows found" → safe to ignore
        throw fetchError;
      }

      let primaryArtistId: string | null = null;

      if (!existingItem) {
        // Step 2: Fetch from Spotify
        const track = await getTrackDetails(trackId);

        // Capture primary artist Spotify ID for genre enrichment
        primaryArtistId = track.artists?.[0]?.id ?? null;

        // Step 3: Extract essentials
        const newItem = {
          id: track.id,
          type: 'track',
          name: track.name,
          artist: track.artists?.map((a: any) => a.name).join(', '),
          album: track.album?.name,
          duration_ms: track.duration_ms,
          cover_url: track.album?.images?.[0]?.url ?? null,
          spotify_url: track.external_urls?.spotify,
          popularity: track.popularity ?? null,
          release_date: track.album?.release_date ?? null,
        };

        // Step 4: Insert into spotify_items
        const { error: insertError } = await supabase
          .from('spotify_items')
          .insert(newItem);

        if (insertError) throw insertError;
      }

      // Step 5: Insert like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ user_id: userId, target_type: 'track', target_id: trackId });

      if (likeError) {
        if (likeError.code === '23505') {
          return NextResponse.json(
            { error: 'You already liked this track' },
            { status: 400 }
          );
        }
        throw likeError;
      }

      // Step 6: Increment like count
      await supabase.rpc('increment_like_count', { item_id: trackId });

      // Step 7: Enrich genres + update user interests (fire and forget)
      enrichItemGenres(supabase, trackId, primaryArtistId, userId).catch(console.error);

      return NextResponse.json({ success: true });
    } else {
      // DELETE branch (unchanged)
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({ user_id: userId, target_type: 'track', target_id: trackId });

      if (deleteError) throw deleteError;

      await supabase.rpc('decrement_like_count', { item_id: trackId });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
