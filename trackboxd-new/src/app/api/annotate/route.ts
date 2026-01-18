import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";

export async function POST(req: NextRequest) {
    return handleAnnotationRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
    return handleAnnotationRequest(req, "PUT");
}

export async function DELETE(req: NextRequest) {
    return handleAnnotationRequest(req, "DELETE");
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const annotationId = searchParams.get("id");
    const userId = searchParams.get("userId");
    const trackId = searchParams.get("trackId");

    if (annotationId) {
        try {
            const cookieStore = cookies();
            const supabase = createClient(cookieStore);

            const { data: annotation, error } = await supabase
                .from("annotations")
                .select("*")
                .eq("id", annotationId)
                .single();

            if (error) throw error;
            return NextResponse.json(annotation);
        } catch (error) {
            console.error("GET annotation error:", error);
            return NextResponse.json(
                { error: "Annotation not found" },
                { status: 404 }
            );
        }
    }

    if (userId && trackId) {
        try {
            const cookieStore = cookies();
            const supabase = createClient(cookieStore);

            const { data: annotations, error } = await supabase
                .from("annotations")
                .select("*")
                .match({ user_id: userId, track_id: trackId });

            return NextResponse.json(annotations || []);
        } catch (error) {
            console.error("GET annotations error:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json(
        {
            error: "Missing parameters. Provide either annotation id or user+track ids",
        },
        { status: 400 }
    );
}

async function handleAnnotationRequest(
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
        if (method === "POST") return createAnnotation(body, supabase, authUser.id);
        if (method === "PUT") return updateAnnotation(body, supabase, authUser.id);
        if (method === "DELETE") return deleteAnnotation(body, supabase, authUser.id);
    } catch (error) {
        console.error("Annotation API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function createAnnotation(body: any, supabase: any, userId: string) {
    const { trackId, timestamp, text: rawText, isPublic } = body;

    if (!trackId || timestamp === undefined || !rawText) {
        return NextResponse.json(
            { error: "Missing required fields: trackId, timestamp, text" },
            { status: 400 }
        );
    }

    if (timestamp < 0) {
        return NextResponse.json(
            { error: "Timestamp must be a positive number" },
            { status: 400 }
        );
    }

    // Clean and validate text
    const text = rawText.trim();
    if (text.length === 0) {
        return NextResponse.json(
            { error: "Annotation text cannot be empty" },
            { status: 400 }
        );
    }
    
    // Add minimum length validation (5 characters)
    if (text.length < 5) {
        return NextResponse.json(
            { error: "Annotation text must be at least 5 characters" },
            { status: 400 }
        );
    }

    try {
        // Start transaction - Removed
        // await supabase.rpc('begin');

        // Ensure the track exists in spotify_items with metadata
        const { data: existingItem, error: fetchError } = await supabase
            .from("spotify_items")
            .select("id")
            .eq("id", trackId)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        if (!existingItem) {
            const track = await getTrackDetails(trackId);
            const newItem = {
                id: track.id,
                type: 'track',
                name: track.name,
                artist: track.artists?.map((a: any) => a.name).join(', '),
                album: track.album?.name,
                duration_ms: track.duration_ms,
                cover_url: track.album?.images?.[0]?.url ?? null,
                spotify_url: track.external_urls?.spotify,
            };
            const { error: insertError } = await supabase
                .from('spotify_items')
                .insert(newItem);
            if (insertError) throw insertError;
        }

        // Create annotation
        const { data: annotation, error: annotationError } = await supabase
            .from("annotations")
            .insert({
                user_id: userId,
                track_id: trackId,
                timestamp,
                text,
                is_public: isPublic !== false,
            })
            .select()
            .single();
        if (annotationError) throw annotationError;

        // Record activity within the same transaction
        const { error: activityError } = await supabase
            .from("activity")
            .insert({
                user_id: userId,
                action: "annotation",
                target_table: "annotation",  // Changed to target_table
                target_id: annotation.id
            });
        if (activityError) throw activityError;

        // Commit transaction - Removed
        // await supabase.rpc('commit');

        // Update annotation count using app logic
        await updateAnnotationCount(supabase, trackId);

        // RPC to increment annotation count (outside transaction) - Removed
        // await supabase.rpc("increment_annotation_count", { item_id: trackId });

        return NextResponse.json(annotation, { status: 201 });
    } catch (error) {
        // await supabase.rpc('rollback'); // Removed
        console.error("Annotation creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function updateAnnotation(body: any, supabase: any, userId: string) {
    const { annotationId, timestamp, text: rawText, isPublic } = body;
    if (!annotationId) {
        return NextResponse.json(
            { error: "Annotation ID is required" },
            { status: 400 }
        );
    }

    // Clean and validate text if provided
    let text = rawText;
    if (text !== undefined) {
        text = rawText.trim();
        if (text.length === 0) {
            return NextResponse.json(
                { error: "Annotation text cannot be empty" },
                { status: 400 }
            );
        }
        // Add minimum length validation (5 characters)
        if (text.length < 5) {
            return NextResponse.json(
                { error: "Annotation text must be at least 5 characters" },
                { status: 400 }
            );
        }
    }

    const { data: existingAnnotation, error: fetchError } = await supabase
        .from("annotations")
        .select("*")
        .eq("id", annotationId)
        .single();
    if (fetchError) throw fetchError;
    if (existingAnnotation.user_id !== userId) {
        return NextResponse.json(
            { error: "Unauthorized to update this annotation" },
            { status: 403 }
        );
    }

    const updateData: any = {};
    if (timestamp !== undefined) {
        if (timestamp < 0) {
            return NextResponse.json(
                { error: "Timestamp must be a positive number" },
                { status: 400 }
            );
        }
        updateData.timestamp = timestamp;
    }
    if (text !== undefined) updateData.text = text;
    if (isPublic !== undefined) updateData.is_public = isPublic;

    const { data: updatedAnnotation, error: updateError } = await supabase
        .from("annotations")
        .update(updateData)
        .eq("id", annotationId)
        .select()
        .single();
    if (updateError) throw updateError;

    // Record activity for update
    const { error: activityError } = await supabase
        .from("activity")
        .insert({
            user_id: userId,
            action: "annotation_update",
            target_table: "annotation", // Changed to target_table
            target_id: annotationId
        });

    if (activityError) {
        console.error("Activity creation error:", activityError);
    }

    return NextResponse.json(updatedAnnotation);
}

async function deleteAnnotation(body: any, supabase: any, userId: string) {
    const { annotationId } = body;
    if (!annotationId) {
        return NextResponse.json(
            { error: "Annotation ID is required" },
            { status: 400 }
        );
    }

    // Fetch existing annotation for ownership & track
    const { data: existingAnnotation, error: fetchError } = await supabase
        .from("annotations")
        .select("track_id, user_id")
        .eq("id", annotationId)
        .single();
    if (fetchError) {
        return NextResponse.json(
            { error: "Annotation not found" },
            { status: 404 }
        );
    }
    if (existingAnnotation.user_id !== userId) {
        return NextResponse.json(
            { error: "Unauthorized to delete this annotation" },
            { status: 403 }
        );
    }

    // Delete activity first
    await supabase
        .from("activity")
        .delete()
        .eq("target_id", annotationId)
        .eq("target_table", "annotation");

    const { error: deleteError } = await supabase
        .from("annotations")
        .delete()
        .eq("id", annotationId);
    if (deleteError) throw deleteError;

    // Update annotation count using app logic
    await updateAnnotationCount(supabase, existingAnnotation.track_id);
    
    // RPC to decrement annotation count - Removed
    // await supabase.rpc("decrement_annotation_count", {
    //    item_id: existingAnnotation.track_id,
    // });

    return NextResponse.json({ success: true });
}

async function updateAnnotationCount(supabase: any, trackId: string) {
    const { count, error } = await supabase
        .from("annotations")
        .select("*", { count: 'exact', head: true })
        .eq("track_id", trackId);

    if (error) {
        console.error("Error fetching annotation count:", error);
        return;
    }

    const { error: updateError } = await supabase
        .from("spotify_items")
        .update({
            annotation_count: count,
            last_updated: new Date().toISOString()
        })
        .eq("id", trackId);

    if (updateError) {
        console.error("Error updating annotation count:", updateError);
    }
}