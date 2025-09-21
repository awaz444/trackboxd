import { searchTracks } from '@/lib/spotify';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await searchTracks(query);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}