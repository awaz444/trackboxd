import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getRequestUser } from "@/lib/supabase/request-user";

// Identity comes from the Bearer token or session cookie, never from a
// client-sent userId.
async function getAuthUser(req: NextRequest, _supabase?: any, _body?: any) {
    return getRequestUser(req);
}

// DELETE /api/journals/[id]/items/[item_id] — remove a track from a manual journal
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; item_id: string } }
) {
    const { id, item_id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthUser(req, supabase, body);

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
        return NextResponse.json({ error: "Cannot remove tracks from a Spotify-imported journal" }, { status: 400 });
    }

    const { error } = await supabase
        .from("journal_items")
        .delete()
        .eq("id", item_id)
        .eq("journal_id", id);

    if (error) {
        console.error("Remove journal item error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
