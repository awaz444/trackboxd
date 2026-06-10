import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  return handleReviewLikeRequest(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return handleReviewLikeRequest(req, 'DELETE');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const reviewId = searchParams.get('reviewId');

  if (!userId || !reviewId) {
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
        target_type: 'review', 
        target_id: reviewId 
      })
      .single();

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('GET review like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleReviewLikeRequest(req: NextRequest, method: 'POST' | 'DELETE') {
  const { userId, reviewId } = await req.json();
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!userId || !reviewId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Start transaction
    await supabase.rpc('begin');

    if (method === 'POST') {
      // Like review logic
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ 
          user_id: userId, 
          target_type: 'review', 
          target_id: reviewId 
        });

      if (likeError) {
        if (likeError.code === '23505') {
          await supabase.rpc('rollback');
          return NextResponse.json(
            { error: 'You already liked this review' },
            { status: 400 }
          );
        }
        throw likeError;
      }

      // Update review's like count
      const { error: countError } = await supabase.rpc('increment_review_like_count', { 
        review_id: reviewId 
      });
      if (countError) throw countError;

      // Fetch review owner to send notification
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single();

      if (!reviewError && reviewData && reviewData.user_id !== userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: reviewData.user_id,
            type: 'like',
            source_id: userId,
            target_id: reviewId,
            is_read: false
          });

        void sendNotificationEmail({
          type: 'like',
          recipientUserId: reviewData.user_id,
          actorUserId: userId,
          targetId: reviewId,
          targetType: 'review',
        });
      }

      await supabase.rpc('commit');
      return NextResponse.json({ success: true });
    } 
    else { // DELETE
      // Unlike review logic
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({ 
          user_id: userId, 
          target_type: 'review', 
          target_id: reviewId 
        });

      if (deleteError) throw deleteError;
      
      // Update review's like count
      const { error: countError } = await supabase.rpc('decrement_review_like_count', { 
        review_id: reviewId 
      });
      if (countError) throw countError;

      await supabase.rpc('commit');
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    await supabase.rpc('rollback');
    console.error('Review like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}