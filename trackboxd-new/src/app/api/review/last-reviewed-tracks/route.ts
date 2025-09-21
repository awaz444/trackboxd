import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const session = await getServerSession(authOptions);
  
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Base query for public reviews
        let query = supabase
            .from("reviews")
            .select(
                `
        id,
        rating,
        text,
        created_at,
        user_id,
        item_id,
        is_public,
        spotify_items!inner (id, type),
        users:user_id(id, name, image_url)
    `
            )
            // Ensure only tracks by filtering on the joined spotify_items table
            .eq("spotify_items.type", "track")
            .eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(4);

        // If userId is provided, get their public reviews
        if (userId) {
            query = query.eq("user_id", userId);
        }

        const { data: reviews, error } = await query;

        if (error) throw error;

        // Fetch additional track details from Spotify for each review
        const reviewsWithTrackDetails = await Promise.all(
            reviews.map(async (review) => {
                if (!session.accessToken) {
                    console.error("No access token available");
                    return review; // Return without track details
                  }

                try {
                    const trackDetails = await getTrackDetails( review.item_id);
                    console.log(`Fetched details for track ${review.item_id}`);
                    return {
                        ...review,
                        track_details: trackDetails,
                    };
                } catch (error) {
                    console.error(
                        `Failed to fetch details for track ${review.item_id}:`,
                        error
                    );
                    return review; // Return review without track details if fetch fails
                }
            })
        );

        return NextResponse.json(reviewsWithTrackDetails);
    } catch (error) {
        console.error("GET last reviews error:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent reviews" },
            { status: 500 }
        );
    }
}
