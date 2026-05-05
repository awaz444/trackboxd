import { getServerUser } from "@/lib/supabase/get-server-user";
// app/api/playlists/[playlist_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
    getPlaylistDetails,
    getPlaylistItems,
    getTrackDetails,
} from "@/lib/spotify";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Add interfaces for Spotify API responses
interface SpotifyTrackItem {
    track: {
        id: string;
    };
}

interface SpotifyArtist {
    name: string;
    id: string;
}

interface SpotifyTrackDetails {
    id: string;
    name: string;
    preview_url: string | null;
    album: {
        name: string;
        images: Array<{ url: string }>;
        release_date: string;
    };
    artists: SpotifyArtist[];
    duration_ms: number;
    popularity: number;
    external_urls: {
        spotify: string;
    };
}

export async function GET(
    req: NextRequest,
    { params }: { params: { playlist_id: string } }
) {
    const user = await getServerUser();

    // Add type assertion and proper null check for accessToken
    if (!user) {
        return NextResponse.json(
            { error: "Valid access token required" },
            { status: 401 }
        );
    }

    try {
        const playlistId = params.playlist_id;
        // Now TypeScript knows accessToken is definitely a string
        // Remove accessToken usage since we're using client credentials for Spotify

        // Get playlist metadata
        const playlist = await getPlaylistDetails(playlistId);

        const itemsResponse = await getPlaylistItems(playlistId, {
            limit: 50,
            fields: "items(track(id))"
        });

        // Filter out null tracks and extract IDs
        const trackIds = itemsResponse.items
            .filter((item: SpotifyTrackItem) => item.track)
            .map((item: SpotifyTrackItem) => item.track.id);

        // Get detailed information for each track in parallel
        const trackDetailsPromises = trackIds.map((trackId: string) =>
            getTrackDetails(trackId).catch((error) => {
                console.error(
                    `Failed to fetch details for track ${trackId}:`,
                    error
                );
                return null;
            })
        );

        const trackDetailsResults = await Promise.all(trackDetailsPromises);

        // Filter out failed requests and transform to our format
        const items = trackDetailsResults
            .filter(
                (
                    track: SpotifyTrackDetails | null
                ): track is SpotifyTrackDetails => track !== null
            )
            .map((track: SpotifyTrackDetails) => ({
                id: track.id,
                name: track.name,
                preview_url: track.preview_url,
                album: {
                    name: track.album.name,
                    images: track.album.images,
                    release_date: track.album.release_date,
                },
                artists: track.artists.map((artist: SpotifyArtist) => ({
                    name: artist.name,
                    id: artist.id,
                })),
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                external_urls: track.external_urls,
            }));

        // Get like count from our database
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: dbPlaylist, error } = await supabase
            .from("spotify_items")
            .select("like_count")
            .eq("id", playlistId)
            .single();

        return NextResponse.json({
            playlist: {
                id: playlist.id,
                name: playlist.name,
                creator: playlist.owner?.display_name || "Unknown",
                cover_url: playlist.images?.[0]?.url || "",
                tracks: playlist.tracks?.total || 0,
                description: playlist.description || "",
                like_count: dbPlaylist?.like_count || 0,
            },
            items,
        });
    } catch (error) {
        console.error("Failed to fetch playlist details:", error);
        return NextResponse.json(
            { error: "Failed to fetch playlist details" },
            { status: 500 }
        );
    }
}
