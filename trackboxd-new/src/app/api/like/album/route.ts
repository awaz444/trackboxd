import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  return handleAlbumLikeRequest(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return handleAlbumLikeRequest(req, 'DELETE');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const albumId = searchParams.get('albumId');

  if (!userId || !albumId) {
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
        target_type: 'album',  // Changed to album
        target_id: albumId     // Changed to albumId
      })
      .single();

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('GET album like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { getAlbumDetails } from '@/lib/spotify';

async function handleAlbumLikeRequest(req: NextRequest, method: 'POST' | 'DELETE') {
  const { userId, albumId } = await req.json();
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!userId || !albumId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  try {
    if (method === 'POST') {
      // 1. Ensure album exists in spotify_items
      const { data: existingItem, error: fetchError } = await supabase
        .from('spotify_items')
        .select('id')
        .eq('id', albumId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingItem) {
        // 2. Fetch from Spotify
        const album = await getAlbumDetails(albumId);

        // 3. Extract essentials
        const newItem = {
          id: album.id,
          type: 'album',
          name: album.name,
          artist: album.artists?.map((a: any) => a.name).join(', '),
          duration_ms: null, // albums don’t have a duration
          album: null,       // not applicable
          cover_url: album.images?.[0]?.url ?? null,
          spotify_url: album.external_urls?.spotify,
        };

        // 4. Insert into spotify_items
        const { error: insertError } = await supabase
          .from('spotify_items')
          .insert(newItem);

        if (insertError) throw insertError;
      }

      // 5. Like album
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          target_type: 'album',
          target_id: albumId,
        });

      if (likeError) {
        if (likeError.code === '23505') {
          return NextResponse.json(
            { error: 'You already liked this album' },
            { status: 400 }
          );
        }
        throw likeError;
      }

      // 6. Increment like count
      await supabase.rpc('increment_like_count', { item_id: albumId });

      return NextResponse.json({ success: true });
    } else {
      // DELETE branch
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({
          user_id: userId,
          target_type: 'album',
          target_id: albumId,
        });

      if (deleteError) throw deleteError;

      await supabase.rpc('decrement_like_count', { item_id: albumId });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Album like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
