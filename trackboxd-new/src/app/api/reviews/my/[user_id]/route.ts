import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/request-user';
import { getContentAccess } from '@/lib/supabase/content-access';

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

    // Owner sees everything; others see public rows only, and nothing at all
    // on a private profile they don't follow.
    const viewer = await getRequestUser(request);
    const access = await getContentAccess(supabase, userId, viewer?.id);
    if (!access.canView) {
      return NextResponse.json([]);
    }

    // Updated query to include item type (without comments)
    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        text,
        created_at,
        like_count,
        is_public,
        item:item_id (
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

    if (!access.isOwner) {
      query = query.eq('is_public', true);
    }

    const { data: reviews, error } = await query;

    if (error) throw error;

    return NextResponse.json(reviews);

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return NextResponse.json(
      { error: "Failed to fetch user reviews" },
      { status: 500 }
    );
  }
}