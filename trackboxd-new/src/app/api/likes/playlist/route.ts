import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getPlaylistDetails } from '@/lib/spotify';

export async function POST(req: NextRequest) {
  return handlePlaylistLikeRequest(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return handlePlaylistLikeRequest(req, 'DELETE');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const playlistId = searchParams.get('playlistId');

  if (!userId || !playlistId) {
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
      .match({ 
        user_id: userId, 
        target_type: 'playlist', 
        target_id: playlistId 
      })
      .single();

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('GET playlist like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePlaylistLikeRequest(req: NextRequest, method: 'POST' | 'DELETE') {
  const { userId, playlistId } = await req.json();
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!userId || !playlistId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  try {
    // Start transaction
    await supabase.rpc('begin');

    // Ensure playlist exists in spotify_items with metadata
    const { data: itemExists, error: itemError } = await supabase
      .from('spotify_items')
      .select('id')
      .eq('id', playlistId)
      .single();

    if (itemError && itemError.code !== 'PGRST116') {
      throw itemError;
    }

    if (!itemExists) {
      const playlist = await getPlaylistDetails(playlistId);
      const newItem = {
        id: playlist.id,
        type: 'playlist',
        name: playlist.name,
        artist: null,
        album: null,
        duration_ms: null,
        cover_url: playlist.images?.[0]?.url ?? null,
        spotify_url: playlist.external_urls?.spotify,
        description: playlist.description ?? null,
      };
      const { error: createError } = await supabase
        .from('spotify_items')
        .insert(newItem);
      if (createError) throw createError;
    }

    if (method === 'POST') {
      // Like playlist logic
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ 
          user_id: userId, 
          target_type: 'playlist', 
          target_id: playlistId 
        });

      if (likeError) {
        if (likeError.code === '23505') {
          await supabase.rpc('rollback');
          return NextResponse.json(
            { error: 'You already liked this playlist' },
            { status: 400 }
          );
        }
        throw likeError;
      }

      // Update playlist's like count
      const { error: countError } = await supabase.rpc('increment_spotify_item_like_count', { 
        item_id: playlistId 
      });
      if (countError) throw countError;

      await supabase.rpc('commit');
      return NextResponse.json({ success: true });
    } 
    else { // DELETE
      // Unlike playlist logic
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({ 
          user_id: userId, 
          target_type: 'playlist', 
          target_id: playlistId 
        });

      if (deleteError) throw deleteError;
      
      // Update playlist's like count
      const { error: countError } = await supabase.rpc('decrement_spotify_item_like_count', { 
        item_id: playlistId 
      });
      if (countError) throw countError;

      await supabase.rpc('commit');
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    await supabase.rpc('rollback');
    console.error('Playlist like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}