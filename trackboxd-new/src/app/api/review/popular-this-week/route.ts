import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {

    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    const accessToken = session.accessToken;

    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Calculate the start of the week (Monday)
        const now = new Date();
        const startOfWeek = new Date(
            now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
        );
        startOfWeek.setHours(0, 0, 0, 0);

        // Get top 5 public reviews from this week, ordered by like_count descending
        const { data: reviews, error } = await supabase
            .from("reviews")
            .select(`
                id,
                rating,
                text,
                created_at,
                user_id,
                item_id,
                like_count,
                is_public,
                spotify_items!inner (
                    id,
                    type,
                    name,
                    artist,
                    album,
                    cover_url,
                    spotify_url
                ),
                users!inner (
                    id, 
                    name, 
                    image_url
                )
            `)
            .eq("spotify_items.type", "track")  // Only get track reviews
            .eq("is_public", true)  // Only public reviews
            .gte("created_at", startOfWeek.toISOString())  // From start of this week
            .order("like_count", { ascending: false })  // Most liked first
            .order("created_at", { ascending: false })  // Then newest first
            .limit(5);  // Top 5

        if (error) throw error;

        // Fetch additional track details from Spotify for each review
        const reviewsWithTrackDetails = await Promise.all(
            
            reviews.map(async (review) => {
                try {
                    const trackDetails = await getTrackDetails( review.item_id);
                    return {
                        ...review,
                        track_details: trackDetails
                    };
                } catch (error) {
                    console.error(`Failed to fetch details for track ${review.item_id}:`, error);
                    return review; // Return review without track details if fetch fails
                }
            })
        );

        return NextResponse.json(reviewsWithTrackDetails);
    } catch (error) {
        console.error("GET top reviews error:", error);
        return NextResponse.json(
            { error: "Failed to fetch top reviews" },
            { status: 500 }
        );
    }
}