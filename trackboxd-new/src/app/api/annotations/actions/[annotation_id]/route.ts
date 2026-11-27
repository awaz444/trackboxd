import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidateItemPages } from '@/lib/revalidate';
import { getRequestUser } from '@/lib/supabase/request-user';

export async function PUT(
  request: Request,
  { params }: { params: { annotation_id: string } }
) {
  const annotationId = params.annotation_id;

  const authUser = await getRequestUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (!annotationId) {
    return NextResponse.json(
      { error: "Annotation ID is required" },
      { status: 400 }
    );
  }

  const { text, timestamp, isPublic } = body;

  if (text === undefined || timestamp === undefined || isPublic === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: existingAnnotation, error: fetchError } = await supabase
      .from('annotations')
      .select('user_id')
      .eq('id', annotationId)
      .single();

    if (fetchError || !existingAnnotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
    if (existingAnnotation.user_id !== authUser.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this annotation" },
        { status: 403 }
      );
    }

    const { data: updated, error } = await supabase
      .from('annotations')
      .update({
        text,
        timestamp,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', annotationId)
      .eq('user_id', authUser.id)
      .select('track_id')
      .maybeSingle();

    if (error) throw error;

    revalidateItemPages(updated?.track_id, [`/annotations/${annotationId}`]);

    return NextResponse.json(
      { message: "Annotation updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating annotation:', error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}