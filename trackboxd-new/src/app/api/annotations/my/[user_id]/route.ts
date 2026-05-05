import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id;

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: annotations, error } = await supabase
      .from('annotations')
      .select(`
        id,
        text,
        timestamp,
        created_at,
        like_count,
        is_public,
        track_id,
        spotify_items:track_id (
          id,
          name,
          artist,
          album,
          cover_url,
          type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match the expected format
    const transformedAnnotations = annotations.map(annotation => ({
      ...annotation,
      item: {
        ...annotation.spotify_items,
      }
    }));

    return NextResponse.json(transformedAnnotations);

  } catch (error) {
    console.error('Error fetching user annotations:', error);
    return NextResponse.json(
      { error: "Failed to fetch user annotations" },
      { status: 500 }
    );
  }
}