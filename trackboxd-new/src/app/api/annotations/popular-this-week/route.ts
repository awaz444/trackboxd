import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const user = await getServerUser();

        if (!user) {
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

        // Top 5 public annotations from this week, most liked first. If the week
        // has fewer than 5, widen to 30 days, 90 days, then all time.
        const DAY = 24 * 60 * 60 * 1000;
        const windows: (string | null)[] = [
            startOfWeek.toISOString(),
            new Date(Date.now() - 30 * DAY).toISOString(),
            new Date(Date.now() - 90 * DAY).toISOString(),
            null,
        ];
        let annotations: any[] = [];
        for (const since of windows) {
            let q = supabase
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
                .eq("is_public", true);
            if (since) q = q.gte("created_at", since);
            const { data, error } = await q
                .order("like_count", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(5);
            if (error) throw error;
            annotations = data ?? [];
            if (annotations.length >= 5) break;
        }

        // Fetch track details from Spotify for each annotation
        const annotationsWithTrackDetails = await Promise.all(
            annotations.map(async (annotation) => {
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
