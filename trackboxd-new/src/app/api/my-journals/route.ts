import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/my-journals — fetch all journals for the authenticated user
export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const authHeader = req.headers.get("Authorization");
    let authUser: any = null;

    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) authUser = user;
    }

    if (!authUser) {
        const { data: { user } } = await supabase.auth.getUser();
        authUser = user;
    }

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("journals")
        .select(`
            *,
            journal_items(track_id, review_id, sort_order, spotify_items(cover_url))
        `)
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("GET my-journals error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Compute review progress and a track-cover collage for each journal
    const journalsWithProgress = (data || []).map((journal: any) => {
        const { journal_items, ...rest } = journal;
        const items = (journal_items || []) as any[];
        const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

        return {
            ...rest,
            total_tracks: items.length,
            reviewed_tracks: items.filter((i) => i.review_id !== null).length,
            track_covers: sorted.slice(0, 4).map((i) => i.spotify_items?.cover_url ?? null),
        };
    });

    return NextResponse.json(journalsWithProgress);
}
