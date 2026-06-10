import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  return handleAnnotationLikeRequest(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return handleAnnotationLikeRequest(req, 'DELETE');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const annotationId = searchParams.get('annotationId');

  if (!userId || !annotationId) {
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
        target_type: 'annotation', 
        target_id: annotationId 
      })
      .single();

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('GET annotation like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAnnotationLikeRequest(req: NextRequest, method: 'POST' | 'DELETE') {
  const { userId, annotationId } = await req.json();
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!userId || !annotationId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    );
  }

  try {
    // Start transaction
    await supabase.rpc('begin');

    if (method === 'POST') {
      // Like annotation logic
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ 
          user_id: userId, 
          target_type: 'annotation', 
          target_id: annotationId 
        });

      if (likeError) {
        if (likeError.code === '23505') {
          await supabase.rpc('rollback');
          return NextResponse.json(
            { error: 'You already liked this annotation' },
            { status: 400 }
          );
        }
        throw likeError;
      }

      // Update annotation's like count
      const { error: countError } = await supabase.rpc('increment_annotation_like_count', { 
        annotation_id: annotationId 
      });
      if (countError) throw countError;

      // Fetch annotation owner to send notification
      const { data: annotationData, error: annotationError } = await supabase
        .from('annotations')
        .select('user_id')
        .eq('id', annotationId)
        .single();

      if (!annotationError && annotationData && annotationData.user_id !== userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: annotationData.user_id,
            type: 'like',
            source_id: userId,
            target_id: annotationId,
            is_read: false
          });

        void sendNotificationEmail({
          type: 'like',
          recipientUserId: annotationData.user_id,
          actorUserId: userId,
          targetId: annotationId,
          targetType: 'annotation',
        });
      }

      await supabase.rpc('commit');
      return NextResponse.json({ success: true });
    } 
    else { // DELETE
      // Unlike annotation logic
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({ 
          user_id: userId, 
          target_type: 'annotation', 
          target_id: annotationId 
        });

      if (deleteError) throw deleteError;
      
      // Update annotation's like count
      const { error: countError } = await supabase.rpc('decrement_annotation_like_count', { 
        annotation_id: annotationId 
      });
      if (countError) throw countError;

      await supabase.rpc('commit');
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    await supabase.rpc('rollback');
    console.error('Annotation like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}