import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getPlaylistItems } from "@/lib/spotify";

async function getAuthUser(req: NextRequest, supabase: any, body?: any) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) return user;
    }
    if (body?.userId) return { id: body.userId };
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// POST /api/journals/[id]/resync — refetch the live Spotify playlist and bring
// a Spotify-imported journal's track list up to date.
//
// journal_items is upserted on its (journal_id, track_id) unique constraint,
// writing only sort_order/removed_from_source — so review_id/is_native_review
// on rows that still exist are left completely untouched. Tracks no longer on
// the live playlist are flagged removed_from_source instead of deleted, so
// any review attached to them stays intact and visible.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthUser(req, supabase, body);

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: journal } = await supabase
        .from("journals")
        .select("user_id, source_type, spotify_playlist_id")
        .eq("id", id)
        .single();

    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    if (journal.user_id !== authUser.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (journal.source_type !== "spotify_playlist" || !journal.spotify_playlist_id) {
        return NextResponse.json({ error: "Only Spotify-imported journals can be resynced" }, { status: 400 });
    }

    let items: any;
    try {
        items = await getPlaylistItems(journal.spotify_playlist_id, { limit: 100 });
    } catch (e: any) {
        const status = e?.status === 404 ? 404 : 502;
        return NextResponse.json(
            {
                error:
                    status === 404
                        ? "Playlist not found on Spotify — it may have been deleted or made private"
                        : "Couldn't reach Spotify, please try again",
            },
            { status }
        );
    }

    const rawTracks = (items.items || [])
        .map((item: any) => item.track)
        .filter((t: any) => t && t.id && t.type === "track");

    const currentTrackIds = new Set(rawTracks.map((t: any) => t.id));

    // Snapshot before writing, so added/removed/restored counts reflect the
    // pre-resync state (rows this resync doesn't touch stay identical either way).
    const { data: existingBefore } = await supabase
        .from("journal_items")
        .select("id, track_id, removed_from_source, sort_order")
        .eq("journal_id", id);

    const existingTrackIds = new Set((existingBefore || []).map((i: any) => i.track_id));
    const addedCount = rawTracks.filter((t: any) => !existingTrackIds.has(t.id)).length;
    const restoredCount = (existingBefore || []).filter(
        (i: any) => i.removed_from_source && currentTrackIds.has(i.track_id)
    ).length;

    // Upsert current tracks into spotify_items (same as the import path)
    for (const track of rawTracks) {
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

    if (rawTracks.length > 0) {
        const rows = rawTracks.map((track: any, idx: number) => ({
            journal_id: id,
            track_id: track.id,
            sort_order: idx,
            removed_from_source: false,
        }));
        const { error: upsertError } = await supabase
            .from("journal_items")
            .upsert(rows, { onConflict: "journal_id,track_id" });
        if (upsertError) throw upsertError;
    }

    // Flag items that dropped off the live playlist instead of deleting them.
    // Push them past the live tracks in sort order so they settle at the
    // bottom of the list instead of interleaving with the fresh ordering.
    const newlyRemoved = (existingBefore || []).filter(
        (i: any) => !currentTrackIds.has(i.track_id) && !i.removed_from_source
    );

    for (const item of newlyRemoved) {
        await supabase
            .from("journal_items")
            .update({ removed_from_source: true, sort_order: rawTracks.length + item.sort_order })
            .eq("id", item.id);
    }

    await supabase.from("journals").update({ last_synced_at: new Date().toISOString() }).eq("id", id);

    const { data: freshItems, error: freshError } = await supabase
        .from("journal_items")
        .select(
            `*, spotify_items(id, name, artist, album, cover_url, spotify_url, duration_ms), reviews(id, rating, text, is_public, created_at)`
        )
        .eq("journal_id", id)
        .order("sort_order", { ascending: true });

    if (freshError) {
        console.error("Error fetching journal items after resync:", freshError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({
        items: freshItems || [],
        added: addedCount,
        removed: newlyRemoved.length,
        restored: restoredCount,
        total: rawTracks.length,
    });
}
