// app/api/reviews/distribution/[song_id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { song_id: string } }
) {
  const songId = params.song_id;

  if (!songId) {
    return NextResponse.json(
      { error: "Song ID is required" },
      { status: 400 }
    );
  }

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Query to get count of reviews for each rating (1-5)
    const { data, error } = await supabase
      .from('reviews')
      .select('rating', { count: 'exact' })
      .eq('item_id', songId)
      .eq('is_public', true);

    if (error) throw error;

    // Initialize a distribution object with all possible ratings
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    // Count ratings manually
    data.forEach((item) => {
      const rating = item.rating as keyof typeof distribution;
      if (distribution[rating] !== undefined) {
        distribution[rating] += 1;
      }
    });

    // Calculate total reviews and percentages
    const totalReviews = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const percentageDistribution = {
      1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
      5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0
    };

    return NextResponse.json({
      counts: distribution,
      percentages: percentageDistribution,
      total_reviews: totalReviews
    });

  } catch (error) {
    console.error('Error fetching rating distribution:', error);
    return NextResponse.json(
      { error: "Failed to fetch rating distribution" },
      { status: 500 }
    );
  }
}