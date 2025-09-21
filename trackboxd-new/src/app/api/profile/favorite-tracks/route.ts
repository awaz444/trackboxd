import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Check if track already exists in favorites
    const { data: existingFavorite, error: checkError } = await supabase
      .from("user_favorite_tracks")
      .select("track_id")
      .eq("user_id", session.user.id)
      .eq("track_id", trackId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing favorite:', checkError);
      return NextResponse.json(
        { error: "Failed to check existing favorite" },
        { status: 500 }
      );
    }

    if (existingFavorite) {
      return NextResponse.json(
        { error: "Track is already in favorites" },
        { status: 400 }
      );
    }

    // Add track to favorites
    const { data: newFavorite, error: insertError } = await supabase
      .from("user_favorite_tracks")
      .insert({
        user_id: session.user.id,
        track_id: trackId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to add favorite track:', insertError);
      return NextResponse.json(
        { error: "Failed to add favorite track" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      favorite: newFavorite
    });
  } catch (error) {
    console.error('Failed to add favorite track:', error);
    return NextResponse.json(
      { error: "Failed to add favorite track" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Remove track from favorites
    const { error: deleteError } = await supabase
      .from("user_favorite_tracks")
      .delete()
      .eq("user_id", session.user.id)
      .eq("track_id", trackId);

    if (deleteError) {
      console.error('Failed to remove favorite track:', deleteError);
      return NextResponse.json(
        { error: "Failed to remove favorite track" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Failed to remove favorite track:', error);
    return NextResponse.json(
      { error: "Failed to remove favorite track" },
      { status: 500 }
    );
  }
}
