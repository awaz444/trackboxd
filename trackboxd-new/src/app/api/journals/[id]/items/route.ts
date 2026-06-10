import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";

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

// POST /api/journals/[id]/items — add a track to a manual journal
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json();
    const authUser = await getAuthUser(req, supabase, body);

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { trackId, reviewId } = body;
    if (!trackId) {
        return NextResponse.json({ error: "trackId is required" }, { status: 400 });
    }

    // Verify journal ownership and source type
    const { data: journal } = await supabase
        .from("journals")
        .select("user_id, source_type")
        .eq("id", id)
        .single();

    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    if (journal.user_id !== authUser.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (journal.source_type === "spotify_playlist") {
        return NextResponse.json({ error: "Cannot add tracks to a Spotify-imported journal" }, { status: 400 });
    }

    // Ensure track exists in spotify_items
    const { data: existingTrack } = await supabase
        .from("spotify_items")
        .select("id")
        .eq("id", trackId)
        .single();

    if (!existingTrack) {
        try {
            const track = await getTrackDetails(trackId);
            await supabase.from("spotify_items").insert({
                id: track.id,
                type: "track",
                name: track.name,
                artist: track.artists?.map((a: any) => a.name).join(", "),
                album: track.album?.name ?? null,
                duration_ms: track.duration_ms,
                cover_url: track.album?.images?.[0]?.url ?? null,
                spotify_url: track.external_urls?.spotify ?? null,
            });
        } catch (e) {
            return NextResponse.json({ error: "Track not found on Spotify" }, { status: 404 });
        }
    }

    // Get current max sort_order
    const { data: maxItem } = await supabase
        .from("journal_items")
        .select("sort_order")
        .eq("journal_id", id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (maxItem?.sort_order ?? -1) + 1;

    const { data: item, error } = await supabase
        .from("journal_items")
        .insert({
            journal_id: id,
            track_id: trackId,
            review_id: reviewId || null,
            is_native_review: false,
            sort_order: nextOrder,
        })
        .select(`*, spotify_items(id, name, artist, album, cover_url, spotify_url)`)
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "Track already in journal" }, { status: 400 });
        }
        console.error("Add journal item error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
}
