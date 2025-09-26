import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getPlaylistDetails } from "@/lib/spotify";

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

        // Get playlist likes from this week
        const { data: weeklyLikes, error: likesError } = await supabase
            .from("likes")
            .select("target_id")
            .eq("target_type", "playlist")
            .gte("created_at", startOfWeekISO);

        if (likesError) throw likesError;

        // Count likes per playlist
        const playlistCounts: Record<string, number> = {};
        weeklyLikes.forEach(like => {
            playlistCounts[like.target_id] = (playlistCounts[like.target_id] || 0) + 1;
        });

        // Convert to array and sort by like count
        const playlistArray = Object.entries(playlistCounts).map(([id, count]) => ({ id, count }));
        playlistArray.sort((a, b) => b.count - a.count);

        // Get top 3 playlist IDs
        const topPlaylistIds = playlistArray.slice(0, 4).map(item => item.id);

        // Fetch and enrich playlist details
        const enrichedPlaylists = await Promise.all(
            topPlaylistIds.map(async (id) => {
                try {
                    // First try to get from our database
                    const { data: dbPlaylist, error } = await supabase
                        .from("spotify_items")
                        .select("*")
                        .eq("id", id)
                        .eq("type", "playlist")
                        .single();

                    // If we have complete data in DB, use that
                    if (dbPlaylist?.name && dbPlaylist?.cover_url) {
                        return {
                            ...dbPlaylist,
                            creator: dbPlaylist.creator || "Unknown",
                            tracks: typeof (dbPlaylist as any).tracks === 'number' ? (dbPlaylist as any).tracks : 0,
                            weekly_likes: playlistCounts[id] || 0
                        };
                    }

                    // Otherwise fetch from Spotify
                    const spotifyPlaylist = await getPlaylistDetails(id);
                    // console.log(spotifyPlaylist);

                    return {
                        id: spotifyPlaylist.id,
                        type: "playlist",
                        name: spotifyPlaylist.name,
                        description: spotifyPlaylist.description || "",
                        cover_url: spotifyPlaylist.images?.[0]?.url || null,
                        spotify_url: spotifyPlaylist.external_urls?.spotify || null,
                        creator: spotifyPlaylist.owner?.display_name || "Unknown",
                        tracks: spotifyPlaylist.tracks?.total ?? 0,
                        like_count: dbPlaylist?.like_count || 0, // Keep DB like count if available
                        weekly_likes: playlistCounts[id] || 0
                    };
                } catch (error) {
                    console.error(`Failed to fetch playlist ${id}:`, error);
                    return null;
                }
            })
        );

        // Filter out failed fetches and sort by weekly likes
        const validPlaylists = enrichedPlaylists.filter(Boolean);
        validPlaylists.sort((a, b) => b.weekly_likes - a.weekly_likes);

        return NextResponse.json(validPlaylists);
    } catch (error) {
        console.error("GET popular playlists error:", error);
        return NextResponse.json(
            { error: "Failed to fetch popular playlists" },
            { status: 500 }
        );
    }
}