import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getRequestUser } from '@/lib/supabase/request-user';
import { canViewUserContent } from '@/lib/supabase/content-access';
import { sendNotificationEmail } from '@/lib/email';
import { revalidateItemPages } from '@/lib/revalidate';

export async function POST(req: NextRequest) {
  return likeAndRevalidate(req, 'POST');
}

export async function DELETE(req: NextRequest) {
  return likeAndRevalidate(req, 'DELETE');
}

// The annotations page is cached for a day; rebuild it when its like count changes.
async function likeAndRevalidate(req: NextRequest, method: 'POST' | 'DELETE') {
  const body = await req.clone().json().catch(() => null);
  const res = await handleAnnotationLikeRequest(req, method);
  if (res.ok && body?.annotationId) revalidateItemPages(null, [`/annotations/${body.annotationId}`]);
  return res;
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

    // Whether someone liked something is part of their profile: hidden on a
    // private profile the viewer doesn't follow.
    const visible = await canViewUserContent(supabase, userId, async () => (await getRequestUser(req))?.id);
    if (!visible) {
      return NextResponse.json({ isLiked: false });
    }
    
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
  // Identity comes from the Bearer token or session cookie; a client-sent
  // userId is ignored so nobody can like or unlike as another user.
  const authUser = await getRequestUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const userId = authUser.id;
  const { annotationId } = (await req.json().catch(() => ({}))) ?? {};
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