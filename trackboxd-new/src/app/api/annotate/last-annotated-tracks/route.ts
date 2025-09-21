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

        // Base query for public annotations
        let query = supabase
            .from("annotations")
            .select(
                `
                id,
                text,
                timestamp,
                created_at,
                user_id,
                track_id,
                is_public,
                like_count,
                users:user_id(id, name, image_url),
                spotify_items:track_id(type, id)
            `
            )
            .eq("spotify_items.type", "track") // Only get track annotations
            .eq("is_public", true) // Only public annotations
            .order("created_at", { ascending: false })
            .limit(4);

        // If userId is provided, get their public annotations
        if (userId) {
            query = query.eq("user_id", userId);
        }

        const { data: annotations, error } = await query;

        if (error) throw error;

        // Fetch additional track details from Spotify for each annotation
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
        console.error("GET last annotations error:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent annotations" },
            { status: 500 }
        );
    }
}
