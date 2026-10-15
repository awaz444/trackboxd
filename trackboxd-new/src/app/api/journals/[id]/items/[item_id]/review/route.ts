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

// POST /api/journals/[id]/items/[item_id]/review
// Creates a new review for this journal item (native review) or links an existing one
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; item_id: string } }
) {
    const { id: journalId, item_id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json();
    const authUser = await getAuthUser(req, supabase, body);

    if (!authUser) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify journal ownership
    const { data: journal } = await supabase
        .from("journals")
        .select("user_id, is_public")
        .eq("id", journalId)
        .single();

    if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    if (journal.user_id !== authUser.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Fetch the journal item
    const { data: journalItem } = await supabase
        .from("journal_items")
        .select("*, spotify_items(id)")
        .eq("id", item_id)
        .eq("journal_id", journalId)
        .single();

    if (!journalItem) return NextResponse.json({ error: "Journal item not found" }, { status: 404 });

    const trackId = journalItem.track_id;
    const { rating, text, existingReviewId } = body;

    // Link existing review (compiling flow)
    if (existingReviewId) {
        const { data: review } = await supabase
            .from("reviews")
            .select("id, user_id")
            .eq("id", existingReviewId)
            .single();

        if (!review || review.user_id !== authUser.id) {
            return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
        }

        const { error } = await supabase
            .from("journal_items")
            .update({ review_id: existingReviewId, is_native_review: false })
            .eq("id", item_id);

        if (error) {
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }

        return NextResponse.json({ success: true, reviewId: existingReviewId });
    }

    // Create a new native review
    if (!rating) {
        return NextResponse.json({ error: "rating is required" }, { status: 400 });
    }
    if (rating < 0.5 || rating > 5 || !Number.isInteger(rating * 2)) {
        return NextResponse.json({ error: "Rating must be between 0.5 and 5 in 0.5 increments" }, { status: 400 });
    }
    if (!text || !text.trim()) {
        return NextResponse.json({ error: "Review text is required" }, { status: 400 });
    }
    const reviewText = text.trim();

    // Editing: this journal entry already has its own review, so update that
    // one (the database keeps the rating shared across the person's reviews).
    if (journalItem.review_id && journalItem.is_native_review) {
        const { data: updated, error: updateError } = await supabase
            .from("reviews")
            .update({ rating, text: reviewText })
            .eq("id", journalItem.review_id)
            .eq("user_id", authUser.id)
            .select()
            .single();

        if (updateError) {
            console.error("Journal review update error:", updateError);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
        return NextResponse.json(updated);
    }

    // New journal review. It is ALWAYS a separate review with the journal's
    // privacy: it never overwrites a review the person already published.
    // The database gives it the person's existing rating for this item, if any.
    const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert({
            user_id: authUser.id,
            item_id: trackId,
            rating,
            text: reviewText,
            is_public: journal.is_public,
        })
        .select()
        .single();

    if (reviewError) {
        if (reviewError.message?.includes("REVIEW_LIMIT")) {
            return NextResponse.json(
                { error: "You can write up to 5 reviews per track or album" },
                { status: 400 }
            );
        }
        console.error("Review creation error:", reviewError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Link review to journal item
    await supabase
        .from("journal_items")
        .update({ review_id: review.id, is_native_review: true })
        .eq("id", item_id);

    // Log activity
    await supabase.from("activity").insert({
        user_id: authUser.id,
        action: "review",
        target_table: "review",
        target_id: review.id,
    });

    return NextResponse.json(review, { status: 201 });
}
