import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getRequestUser } from "@/lib/supabase/request-user";
import { getContentAccess } from "@/lib/supabase/content-access";
import { getPlaylistDetails, getPlaylistItems, getTrackDetails } from "@/lib/spotify";

// Identity comes from the Bearer token or session cookie, never from a
// client-sent userId.
async function getAuthUser(req: NextRequest, _supabase?: any, _body?: any) {
    return getRequestUser(req);
}

// GET /api/journals?userId=xxx — list journals for a user (public only unless self)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const currentUser = await getAuthUser(req, supabase);

    if (!targetUserId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Nothing from a private profile the viewer doesn't follow; public
    // journals only unless it's the owner.
    const access = await getContentAccess(supabase, targetUserId, currentUser?.id);
    if (!access.canView) {
        return NextResponse.json([]);
    }
    const isSelf = access.isOwner;

    let query = supabase
        .from("journals")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

    if (!isSelf) {
        query = query.eq("is_public", true);
    }

    const { data, error } = await query;
    if (error) {
        console.error("GET journals error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST /api/journals — create a new journal
export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json();
    const authUser = await getAuthUser(req, supabase, body);

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { title, subtitle, isPublic, sourceType, spotifyPlaylistId } = body;

    if (!title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (sourceType && !["manual", "spotify_playlist"].includes(sourceType)) {
        return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
    }

    try {
        let coverUrl: string | null = null;
        let resolvedTitle = title.trim();
        let resolvedSubtitle = subtitle?.trim() || null;
        let tracks: any[] = [];

        if (sourceType === "spotify_playlist" && spotifyPlaylistId) {
            const [playlist, items] = await Promise.all([
                getPlaylistDetails(spotifyPlaylistId),
                getPlaylistItems(spotifyPlaylistId, { limit: 100 }),
            ]);

            resolvedTitle = playlist.name || resolvedTitle;
            resolvedSubtitle = playlist.description || resolvedSubtitle;
            coverUrl = playlist.images?.[0]?.url ?? null;

            // Collect tracks from playlist items
            const rawTracks = (items.items || [])
                .map((item: any) => item.track)
                .filter((t: any) => t && t.id && t.type === "track");

            tracks = rawTracks;

            // Upsert all tracks into spotify_items
            for (const track of tracks) {
                const itemData = {
                    id: track.id,
                    type: "track",
                    name: track.name,
                    artist: track.artists?.map((a: any) => a.name).join(", "),
                    album: track.album?.name ?? null,
                    duration_ms: track.duration_ms,
                    cover_url: track.album?.images?.[0]?.url ?? null,
                    spotify_url: track.external_urls?.spotify ?? null,
                };
                await supabase.from("spotify_items").upsert(itemData, { onConflict: "id", ignoreDuplicates: true });
            }
        }

        // Insert journal
        const { data: journal, error: journalError } = await supabase
            .from("journals")
            .insert({
                user_id: authUser.id,
                title: resolvedTitle,
                subtitle: resolvedSubtitle,
                is_public: isPublic !== false,
                source_type: sourceType || "manual",
                spotify_playlist_id: spotifyPlaylistId || null,
                cover_url: coverUrl,
            })
            .select()
            .single();

        if (journalError) throw journalError;

        // Bulk insert journal_items for Spotify playlists
        if (tracks.length > 0) {
            const journalItems = tracks.map((track: any, idx: number) => ({
                journal_id: journal.id,
                track_id: track.id,
                sort_order: idx,
            }));
            const { error: itemsError } = await supabase.from("journal_items").insert(journalItems);
            if (itemsError) throw itemsError;
        }

        return NextResponse.json(journal, { status: 201 });
    } catch (error) {
        console.error("Journal creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
