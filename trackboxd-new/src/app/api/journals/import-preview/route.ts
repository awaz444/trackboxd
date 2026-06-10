import { NextRequest, NextResponse } from "next/server";
import { getPlaylistDetails, getPlaylistItems } from "@/lib/spotify";

// Extract Spotify playlist ID from URL or raw ID
function extractPlaylistId(input: string): string | null {
    const trimmed = input.trim();
    // Direct Spotify ID: 22 alphanumeric chars
    if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;
    // Spotify URL patterns: spotify:playlist:ID or open.spotify.com/playlist/ID
    const urlMatch = trimmed.match(/playlist[/:]([\w]{22})/);
    if (urlMatch) return urlMatch[1];
    return null;
}

// GET /api/journals/import-preview?playlistId=xxx
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("playlistId") || "";

    const playlistId = extractPlaylistId(raw);
    if (!playlistId) {
        return NextResponse.json({ error: "Invalid playlist ID or URL" }, { status: 400 });
    }

    try {
        const [playlist, items] = await Promise.all([
            getPlaylistDetails(playlistId),
            getPlaylistItems(playlistId, { limit: 100 }),
        ]);

        const tracks = (items.items || [])
            .map((item: any) => item.track)
            .filter((t: any) => t && t.id && t.type === "track")
            .map((track: any) => ({
                id: track.id,
                name: track.name,
                artist: track.artists?.map((a: any) => a.name).join(", ") ?? "",
                album: track.album?.name ?? "",
                cover_url: track.album?.images?.[0]?.url ?? null,
                duration_ms: track.duration_ms,
            }));

        return NextResponse.json({
            id: playlist.id,
            title: playlist.name,
            subtitle: playlist.description || null,
            cover_url: playlist.images?.[0]?.url ?? null,
            owner: playlist.owner?.display_name ?? null,
            total_tracks: tracks.length,
            tracks,
        });
    } catch (error: any) {
        console.error("Import preview error:", error);
        if (error.message?.includes("404")) {
            return NextResponse.json({ error: "Playlist not found or is private" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
    }
}
