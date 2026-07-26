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

// GET /api/journals/[id] — fetch journal with items + reviews
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: journal, error: journalError } = await supabase
        .from("journals")
        .select("*, users(id, name, image_url)")
        .eq("id", id)
        .single();

    if (journalError || !journal) {
        return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    // Private journals are unlisted, not access-controlled: anyone with the
    // direct link can view, but they're omitted from profile/listing queries.

    // Fetch items with track metadata and reviews
    const { data: items, error: itemsError } = await supabase
        .from("journal_items")
        .select(`
            *,
            spotify_items(id, name, artist, album, cover_url, spotify_url, duration_ms),
            reviews(id, rating, text, is_public, created_at)
        `)
        .eq("journal_id", id)
        .order("sort_order", { ascending: true });

    if (itemsError) {
        console.error("Error fetching journal items:", itemsError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ ...journal, items: items || [] });
}

// PUT /api/journals/[id] — update title, subtitle, or privacy
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json();
    const authUser = await getAuthUser(req, supabase, body);

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: journal } = await supabase
        .from("journals")
        .select("user_id, is_public")
        .eq("id", id)
        .single();

    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    if (journal.user_id !== authUser.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { title, subtitle, isPublic, coverUrl } = body;
    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle?.trim() || null;
    if (isPublic !== undefined) updateData.is_public = isPublic;
    if (coverUrl !== undefined) updateData.cover_url = coverUrl || null;

    const { data: updated, error } = await supabase
        .from("journals")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Journal update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Sync privacy on native reviews when is_public changes
    if (isPublic !== undefined && isPublic !== journal.is_public) {
        await supabase.rpc
            ? null // fallback to manual query
            : null;

        const { data: nativeItems } = await supabase
            .from("journal_items")
            .select("review_id")
            .eq("journal_id", id)
            .eq("is_native_review", true)
            .not("review_id", "is", null);

        if (nativeItems && nativeItems.length > 0) {
            const reviewIds = nativeItems.map((i: any) => i.review_id);
            await supabase
                .from("reviews")
                .update({ is_public: isPublic })
                .in("id", reviewIds);
        }
    }

    return NextResponse.json(updated);
}

// DELETE /api/journals/[id] — delete journal and its native reviews
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
        .select("user_id")
        .eq("id", id)
        .single();

    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    if (journal.user_id !== authUser.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Delete native reviews first
    const { data: nativeItems } = await supabase
        .from("journal_items")
        .select("review_id")
        .eq("journal_id", id)
        .eq("is_native_review", true)
        .not("review_id", "is", null);

    if (nativeItems && nativeItems.length > 0) {
        const reviewIds = nativeItems.map((i: any) => i.review_id);
        await supabase.from("reviews").delete().in("id", reviewIds);
    }

    // journal_items deleted via CASCADE
    const { error } = await supabase.from("journals").delete().eq("id", id);
    if (error) {
        console.error("Journal delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
