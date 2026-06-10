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
            journal_items(count)
        `)
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("GET my-journals error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Compute review progress for each journal
    const journalsWithProgress = await Promise.all(
        (data || []).map(async (journal: any) => {
            const { count: totalCount } = await supabase
                .from("journal_items")
                .select("*", { count: "exact", head: true })
                .eq("journal_id", journal.id);

            const { count: reviewedCount } = await supabase
                .from("journal_items")
                .select("*", { count: "exact", head: true })
                .eq("journal_id", journal.id)
                .not("review_id", "is", null);

            return {
                ...journal,
                total_tracks: totalCount ?? 0,
                reviewed_tracks: reviewedCount ?? 0,
            };
        })
    );

    return NextResponse.json(journalsWithProgress);
}
