import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Calculate the start of the week (Monday)
        const now = new Date();
        const startOfWeek = new Date(
            now.setDate(
                now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
            )
        );
        startOfWeek.setHours(0, 0, 0, 0);

        // Get top 5 public annotations from this week, ordered by like_count descending
        const { data: annotations, error } = await supabase
            .from("annotations")
            .select(
                `
                id,
                text,
                timestamp,
                created_at,
                like_count,
                is_public,
                user_id,
                track_id,
                users:user_id(id, name, image_url)
            `
            )
            .eq("is_public", true) // Only public annotations
            .gte("created_at", startOfWeek.toISOString()) // From start of this week
            .order("like_count", { ascending: false }) // Most liked first
            .order("created_at", { ascending: false }) // Then newest first
            .limit(5); // Top 5

        if (error) throw error;

        // Fetch track details from Spotify for each annotation
        const annotationsWithTrackDetails = await Promise.all(
            annotations.map(async (annotation) => {
                if (!session.accessToken) {
                    console.error("No access token available");
                    return annotation; // Return without track details
                  }
                try {
                    const trackDetails = await getTrackDetails(
                        annotation.track_id
                    );
                    return {
                        ...annotation,
                        track_details: trackDetails,
                    };
                } catch (error) {
                    console.error(
                        `Failed to fetch details for track ${annotation.track_id}:`,
                        error
                    );
                    return annotation; // Return annotation without track details if fetch fails
                }
            })
        );

        return NextResponse.json(annotationsWithTrackDetails);
    } catch (error) {
        console.error("GET top annotations error:", error);
        return NextResponse.json(
            { error: "Failed to fetch top annotations" },
            { status: 500 }
        );
    }
}
