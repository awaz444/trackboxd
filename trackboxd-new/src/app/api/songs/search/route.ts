import { searchTracks } from '@/lib/spotify';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

  try {
    const limit = limitParam ? Number(limitParam) : undefined;
    const items = await searchTracks(query, { limit, market });
    // Return consistent shape: { tracks: { items: [...] } }
    return NextResponse.json({ tracks: { items } });
  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}