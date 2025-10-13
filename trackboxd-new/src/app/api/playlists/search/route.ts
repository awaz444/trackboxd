import { NextResponse } from 'next/server';
import { searchTracksAlbumsAndPlaylists } from '@/lib/spotify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limitParam = searchParams.get('limit');
    const market = searchParams.get('market') || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    const playlistLimit = limitParam ? Number(limitParam) : 10;
    const results = await searchTracksAlbumsAndPlaylists(query, {
      trackLimit: 0,
      albumLimit: 0,
      playlistLimit,
      market,
    });

    // Return playlists array directly for simplicity
    return NextResponse.json(results.playlists || []);
  } catch (error) {
    console.error('Spotify playlist search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}