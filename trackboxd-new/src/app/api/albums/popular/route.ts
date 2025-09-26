import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getAlbumDetails } from "@/lib/spotify";

interface SpotifyArtist {
    name: string;
    id: string;
}

interface SpotifyAlbum {
    id: string;
    name: string;
    description?: string;
    images?: { url: string }[];
    external_urls?: {
        spotify: string;
    };
    artists?: SpotifyArtist[];
    tracks?: {
        total: number;
    };
    release_date?: string;
}

interface EnrichedAlbum {
    id: string;
    type: "album";
    name: string;
    description: string;
    cover_url: string | null;
    spotify_url: string | null;
    creator: string;
    tracks: number;
    release_date: string;
    like_count: number;
    weekly_likes: number;
}

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Calculate start of the week (Monday)
        const now = new Date();
        const startOfWeek = new Date(
            now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
        );
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekISO = startOfWeek.toISOString();

        // Get album likes from this week
        const { data: weeklyLikes, error: likesError } = await supabase
            .from("likes")
            .select("target_id, created_at")
            .eq("target_type", "album")
            .gte("created_at", startOfWeekISO);

        if (likesError) throw likesError;
        
        // If no likes, return empty array
        if (!weeklyLikes || weeklyLikes.length === 0) {
            return NextResponse.json([]);
        }

        // Extract album IDs from likes
        const albumIdsFromLikes = weeklyLikes.map(like => like.target_id);
        
        // Get album metadata from spotify_items
        const { data: albumItems, error: itemsError } = await supabase
            .from("spotify_items")
            .select("id")
            .eq("type", "album")
            .in("id", albumIdsFromLikes);

        if (itemsError) throw itemsError;
        
        // If no valid albums, return empty array
        if (!albumItems || albumItems.length === 0) {
            return NextResponse.json([]);
        }

        // Filter to only valid album IDs
        const validAlbumIds = albumItems.map(item => item.id);
        
        // Count likes per album (only for valid albums)
        const albumCounts: Record<string, number> = {};
        weeklyLikes.forEach(like => {
            if (validAlbumIds.includes(like.target_id)) {
                albumCounts[like.target_id] = (albumCounts[like.target_id] || 0) + 1;
            }
        });

        // Convert to array and sort by like count
        const albumArray = Object.entries(albumCounts).map(([id, count]) => ({ id, count }));
        albumArray.sort((a, b) => b.count - a.count);

        // Get top 3 album IDs
        const topAlbumIds = albumArray.slice(0, 4).map(item => item.id);

        // Fetch and enrich album details
        const enrichedAlbums = await Promise.all(
            topAlbumIds.map(async (id) => {
                try {
                    // Get album from our database
                    const { data: dbAlbum, error } = await supabase
                        .from("spotify_items")
                        .select("*")
                        .eq("id", id)
                        .eq("type", "album")
                        .single();

                    if (error) throw error;

                    // Fetch from Spotify if needed
                    let spotifyAlbum = null;
                    if (!dbAlbum?.name || !dbAlbum?.cover_url) {
                        spotifyAlbum = await getAlbumDetails(id);
                    }

                    if (!dbAlbum && !spotifyAlbum) {
                        console.warn(`Album not found: ${id}`);
                        return null;
                    }

                    return {
                        id: dbAlbum?.id || spotifyAlbum?.id,
                        type: "album",
                        name: dbAlbum?.name || spotifyAlbum?.name,
                        description: dbAlbum?.description || spotifyAlbum?.description || "",
                        cover_url: dbAlbum?.cover_url || spotifyAlbum?.images?.[0]?.url || null,
                        spotify_url: dbAlbum?.spotify_url || spotifyAlbum?.external_urls?.spotify || null,
                        creator: dbAlbum?.artist || 
                            (spotifyAlbum?.artists?.map((a: SpotifyArtist) => a.name).join(", ") || "Unknown"),
                        tracks: typeof (dbAlbum as any)?.tracks === 'number'
                            ? (dbAlbum as any).tracks
                            : (spotifyAlbum?.tracks?.total ?? 0),
                        release_date: dbAlbum?.release_date || spotifyAlbum?.release_date || "",
                        like_count: dbAlbum?.like_count || 0,
                        weekly_likes: albumCounts[id] || 0
                    };
                } catch (error) {
                    console.error(`Failed to process album ${id}:`, error);
                    return null;
                }
            })
        );

        // Filter out failed fetches and sort by weekly likes
        const validAlbums = enrichedAlbums
            .filter((album): album is EnrichedAlbum => album !== null)
            .sort((a, b) => (b.weekly_likes || 0) - (a.weekly_likes || 0));

        return NextResponse.json(validAlbums);
    } catch (error) {
        console.error("GET popular albums error:", error);
        return NextResponse.json(
            { error: "Failed to fetch popular albums" },
            { status: 500 }
        );
    }
}