import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/profile/[username]/journals — public journals for a profile
export async function GET(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    const { username } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Resolve username to user id
    const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("name", username)
        .single();

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this is the requesting user's own profile
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isSelf = authUser?.id === user.id;

    let query = supabase
        .from("journals")
        .select("id, title, subtitle, is_public, source_type, cover_url, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (!isSelf) {
        query = query.eq("is_public", true);
    }

    const { data: journals, error } = await query;
    if (error) {
        console.error("Profile journals error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Add track counts and review progress
    const journalsWithCounts = await Promise.all(
        (journals || []).map(async (journal: any) => {
            const [{ count: totalCount }, { count: reviewedCount }] = await Promise.all([
                supabase
                    .from("journal_items")
                    .select("*", { count: "exact", head: true })
                    .eq("journal_id", journal.id),
                supabase
                    .from("journal_items")
                    .select("*", { count: "exact", head: true })
                    .eq("journal_id", journal.id)
                    .not("review_id", "is", null),
            ]);

            return {
                ...journal,
                total_tracks: totalCount ?? 0,
                reviewed_tracks: reviewedCount ?? 0,
            };
        })
    );

    return NextResponse.json(journalsWithCounts);
}
