import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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
