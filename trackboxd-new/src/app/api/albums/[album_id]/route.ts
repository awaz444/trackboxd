import { getAlbumTracks } from "@/lib/spotify";
import { getTrackDetails } from "@/lib/spotify";
import { getAlbumDetails } from "@/lib/spotify";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(
    request: Request,
    { params }: { params: { album_id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const { album_id } = params;

        if (!album_id) {
            return NextResponse.json(
                { error: "Album ID is required" },
                { status: 400 }
            );
        }

        // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
        
        // Fetch album stats from our database
        const { data: albumStats, error: statsError } = await supabase
            .from("spotify_items")
            .select(
                "like_count, review_count, annotation_count, avg_rating"
            )
            .eq("id", album_id)
            .eq("type", "album")
            .single();

        // Get Spotify album details and tracks in parallel
        const [spotifyAlbum, albumTracks] = await Promise.all([
            getAlbumDetails(album_id),
            getAlbumTracks(album_id, {
                limit: 50,
            }),
        ]);

        // Merge Spotify data with our stats
        const albumDetails = {
            ...spotifyAlbum,
            stats: albumStats || {
                like_count: 0,
                review_count: 0,
                annotation_count: 0,
                avg_rating: 0,
            },
        };

        // If no tracks found, return album info with empty tracks array
        if (!albumTracks.items || albumTracks.items.length === 0) {
            return NextResponse.json({
                album: albumDetails,
                tracks: [],
                albumInfo: {
                    total: 0,
                    limit: albumTracks.limit,
                    offset: albumTracks.offset,
                },
            });
        }

        // Get full details for each track in parallel
        const tracksWithDetails = await Promise.all(
            albumTracks.items.map(async (track: any) => {
                try {
                    if (!session.accessToken) {
                        throw new Error("No access token available");
                    }
                    const trackDetails = await getTrackDetails(
                        track.id
                    );
                    return {
                        ...track,
                        details: trackDetails,
                    };
                } catch (error) {
                    console.error(
                        `Error fetching details for track ${track.id}:`,
                        error
                    );
                    return {
                        ...track,
                        details: null,
                        error: "Failed to load track details",
                    };
                }
            })
        );

        return NextResponse.json({
            album: albumDetails,
            tracks: tracksWithDetails,
            albumInfo: {
                total: albumTracks.total,
                limit: albumTracks.limit,
                offset: albumTracks.offset,
                next: albumTracks.next,
                previous: albumTracks.previous,
            },
        });
    } catch (error) {
        console.error("Error in album tracks API:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch album tracks", details: errorMessage },
            { status: 500 }
        );
    }
}