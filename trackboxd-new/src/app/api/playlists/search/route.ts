import { NextResponse } from 'next/server';
import { searchPlaylists } from '@/lib/spotify';

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

    const limit = limitParam ? Number(limitParam) : 10;
    const results = await searchPlaylists(query, { limit, market });
    // Normalize to items array similar to tracks/albums search
    const items = results.playlists?.items || results.items || [];
    return NextResponse.json(items);
  } catch (error) {
    console.error('Spotify playlist search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}