import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { review_id: string } }
) {
  const reviewId = params.review_id;

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
        .select('item_id')
        .eq('id', reviewId)
        .single();

    if (fetchError) {
        return NextResponse.json(
            { error: "Review not found" },
            { status: 404 }
        );
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

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
    const body = await request.json();
  
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
  
    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({
        rating,
        text,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select('item_id')
      .single();

    if (error) throw error;

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

