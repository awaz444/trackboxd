import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getAlbumDetails, getTrackDetails } from "@/lib/spotify";

export async function POST(req: NextRequest) {
    return handleReviewRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
    return handleReviewRequest(req, "PUT");
}

export async function DELETE(req: NextRequest) {
    return handleReviewRequest(req, "DELETE");
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("id");
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("itemId");

    if (reviewId) {
        try {
            const cookieStore = cookies();
            const supabase = createClient(cookieStore);

            const { data: review, error } = await supabase
                .from("reviews")
                .select("*")
                .eq("id", reviewId)
                .single();

            if (error) throw error;
            return NextResponse.json(review);
        } catch (error) {
            console.error("GET review error:", error);
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            );
        }
    }

    if (userId && itemId) {
        try {
            const cookieStore = cookies();
            const supabase = createClient(cookieStore);

            const { data: review, error } = await supabase
                .from("reviews")
                .select("*")
                .match({ user_id: userId, item_id: itemId })
                .single();

            return NextResponse.json(review ? review : null);
        } catch (error) {
            console.error("GET review error:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json(
        {
            error: "Missing parameters. Provide either review id or user+item ids",
        },
        { status: 400 }
    );
}

async function handleReviewRequest(
    req: NextRequest,
    method: "POST" | "PUT" | "DELETE"
) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await req.json();
    let authUser;

    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);
        if (error) console.error("Token validation error:", error);
        else authUser = user;
    }

    if (!authUser && body?.userId) {
        authUser = { id: body.userId };
    }

    if (!authUser) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }

    try {
        if (method === "POST") return createReview(body, supabase, authUser.id);
        if (method === "PUT") return updateReview(body, supabase, authUser.id);
        if (method === "DELETE")
            return deleteReview(body, supabase, authUser.id);
    } catch (error) {
        console.error("Review API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function createReview(body: any, supabase: any, userId: string) {
    const { itemId, itemType, rating, text, isPublic } = body;

    if (!itemId || !itemType || !rating) {
        return NextResponse.json(
            { error: "Missing required fields: itemId, itemType, rating" },
            { status: 400 }
        );
    }
    if (!["track", "album"].includes(itemType)) {
        return NextResponse.json(
            { error: "Invalid itemType. Only track or album allowed" },
            { status: 400 }
        );
    }
    if (rating < 0.5 || rating > 5 || !Number.isInteger(rating * 2)) {
        return NextResponse.json(
            { error: "Rating must be between 0.5 and 5 in 0.5 increments" },
            { status: 400 }
        );
    }

    // Start a transaction
    const { data, error } = await supabase.rpc('begin');

    try {
        // Ensure the spotify item exists with metadata
        const { data: existingItem, error: fetchItemError } = await supabase
            .from("spotify_items")
            .select("id")
            .eq("id", itemId)
            .single();
        if (fetchItemError && fetchItemError.code !== "PGRST116") {
            throw fetchItemError;
        }

        if (!existingItem) {
            if (itemType === "track") {
                const track = await getTrackDetails(itemId);
                const newItem = {
                    id: track.id,
                    type: "track",
                    name: track.name,
                    artist: track.artists?.map((a: any) => a.name).join(", "),
                    album: track.album?.name,
                    duration_ms: track.duration_ms,
                    cover_url: track.album?.images?.[0]?.url ?? null,
                    spotify_url: track.external_urls?.spotify,
                };
                const { error: insertTrackErr } = await supabase
                    .from("spotify_items")
                    .insert(newItem);
                if (insertTrackErr) throw insertTrackErr;
            } else if (itemType === "album") {
                const album = await getAlbumDetails(itemId);
                const newItem = {
                    id: album.id,
                    type: "album",
                    name: album.name,
                    artist: album.artists?.map((a: any) => a.name).join(", "),
                    album: null,
                    duration_ms: null,
                    cover_url: album.images?.[0]?.url ?? null,
                    spotify_url: album.external_urls?.spotify,
                };
                const { error: insertAlbumErr } = await supabase
                    .from("spotify_items")
                    .insert(newItem);
                if (insertAlbumErr) throw insertAlbumErr;
            } else {
                // Should not happen due to earlier validation
                throw new Error("Unsupported itemType for review");
            }
        }

        // Create the review
        const { data: review, error: reviewError } = await supabase
            .from("reviews")
            .insert({
                user_id: userId,
                item_id: itemId,
                rating,
                text: text || null,
                is_public: isPublic !== false,
            })
            .select()
            .single();
        if (reviewError) {
            if (reviewError.code === "23505") {
                await supabase.rpc('rollback');
                return NextResponse.json(
                    { error: "You have already reviewed this item" },
                    { status: 400 }
                );
            }
            throw reviewError;
        }

        const { error: activityError } = await supabase
            .from("activity")
            .insert({
                user_id: userId,
                action: "review",
                target_table: "review",  // Changed to target_table
                target_id: review.id
            });
        if (activityError) throw activityError;

        // Then update the average rating (is_delete=false for creation)
        const { error: ratingError } = await supabase.rpc("update_avg_rating", {
            item_id: itemId,
            rating_to_adjust: rating,
            is_delete: false
        });
        if (ratingError) throw ratingError;

        // Increment review count
        const { error: incrementError } = await supabase.rpc("increment_review_count", { 
            item_id: itemId 
        });
        if (incrementError) throw incrementError;

        // Commit the transaction
        await supabase.rpc('commit');

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        await supabase.rpc('rollback');
        console.error("Review creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function updateReview(body: any, supabase: any, userId: string) {
    const { reviewId, rating, text, isPublic } = body;
    if (!reviewId) {
        return NextResponse.json(
            { error: "Review ID is required" },
            { status: 400 }
        );
    }

    const { data: existingReview, error: fetchError } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", reviewId)
        .single();
    if (fetchError) throw fetchError;
    if (existingReview.user_id !== userId) {
        return NextResponse.json(
            { error: "Unauthorized to update this review" },
            { status: 403 }
        );
    }

    const updateData: any = {};
    if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }
        updateData.rating = rating;
    }
    if (text !== undefined) updateData.text = text;
    if (isPublic !== undefined) updateData.is_public = isPublic;

    const { data: updatedReview, error: updateError } = await supabase
        .from("reviews")
        .update(updateData)
        .eq("id", reviewId)
        .select()
        .single();
    if (updateError) throw updateError;

    // Record activity for update
    const { error: activityError } = await supabase
        .from("activity")
        .insert({
            user_id: userId,
            action: "review_update",
            target_table: "review", // Changed to target_table
            target_id: reviewId
        });

    if (activityError) {
        console.error("Activity creation error:", activityError);
    }

    if (rating !== undefined) {
        // First remove the old rating from the average (is_delete=true)
        await supabase.rpc("update_avg_rating", {
            item_id: existingReview.item_id,
            rating_to_adjust: existingReview.rating,
            is_delete: true
        });

        // Then add the new rating to the average (is_delete=false)
        await supabase.rpc("update_avg_rating", {
            item_id: existingReview.item_id,
            rating_to_adjust: rating,
            is_delete: false
        });
    }

    return NextResponse.json(updatedReview);
}

async function deleteReview(body: any, supabase: any, userId: string) {
    const { reviewId } = body;
    if (!reviewId) {
        return NextResponse.json(
            { error: "Review ID is required" },
            { status: 400 }
        );
    }

    // Fetch existing review for ownership & item
    const { data: existingReview, error: fetchError } = await supabase
        .from("reviews")
        .select("item_id, user_id")
        .eq("id", reviewId)
        .single();
    if (fetchError) {
        return NextResponse.json(
            { error: "Review not found" },
            { status: 404 }
        );
    }
    if (existingReview.user_id !== userId) {
        return NextResponse.json(
            { error: "Unauthorized to delete this review" },
            { status: 403 }
        );
    }

    // Delete activity first
    await supabase
        .from("activity")
        .delete()
        .eq("target_id", reviewId)
        .eq("target_table", "review");

    const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);
    if (deleteError) throw deleteError;

    // Then update the average by removing this review's rating
    await supabase.rpc("update_avg_rating", {
        item_id: existingReview.item_id,
        rating_to_adjust: existingReview.rating,
        is_delete: true
    });

    // RPC to decrement review count
    await supabase.rpc("decrement_review_count", {
        item_id: existingReview.item_id,
    });

    return NextResponse.json({ success: true });
}