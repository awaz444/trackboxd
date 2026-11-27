import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidateItemPages } from '@/lib/revalidate';
import { getRequestUser } from '@/lib/supabase/request-user';

export async function DELETE(
  request: Request,
  { params }: { params: { review_id: string } }
) {
  const reviewId = params.review_id;

  const authUser = await getRequestUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!reviewId) {
    return NextResponse.json(
      { error: "Review ID is required" },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch review first to get item_id
    const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('item_id, user_id')
        .eq('id', reviewId)
        .single();

    if (fetchError) {
        return NextResponse.json(
            { error: "Review not found" },
            { status: 404 }
        );
    }

    if (existingReview.user_id !== authUser.id) {
        return NextResponse.json(
            { error: "Unauthorized to delete this review" },
            { status: 403 }
        );
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', authUser.id);

    if (error) throw error;

    revalidateItemPages(existingReview.item_id, [`/reviews/${reviewId}`]);

    return NextResponse.json(
      { message: "Review deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}

export async function PUT(
    request: Request,
    { params }: { params: { review_id: string } }
  ) {
    const reviewId = params.review_id;

    const authUser = await getRequestUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
  
    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }
  
    const { rating, text, isPublic } = body;
  
    if (rating === undefined || !text || isPublic === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
  
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
  
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (existingReview.user_id !== authUser.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this review" },
        { status: 403 }
      );
    }

    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({
        rating,
        text,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('user_id', authUser.id)
      .select('item_id')
      .single();

    if (error) throw error;

    revalidateItemPages(updatedReview?.item_id, [`/reviews/${reviewId}`]);

    return NextResponse.json(
      { message: "Review updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

