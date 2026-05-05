import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTrackDetails } from "@/lib/spotify";

export async function POST(request: Request) {
  const user = await getServerUser();
  
  if (!user) {
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

    // Enforce max 4 favorites per user
    const { count, error: countError } = await supabase
      .from("user_favorite_tracks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) {
      console.error('Error counting favorites:', countError);
      return NextResponse.json({ error: "Failed to validate favorites" }, { status: 500 });
    }
    if ((count || 0) >= 4) {
      return NextResponse.json(
        { error: "You can only have up to 4 favorite tracks" },
        { status: 400 }
      );
    }

    // Ensure spotify_items has this track with metadata
    const { data: existingItem, error: itemFetchError } = await supabase
      .from("spotify_items")
      .select("id")
      .eq("id", trackId)
      .single();
    if (itemFetchError && itemFetchError.code !== 'PGRST116') {
      console.error('Error fetching spotify item:', itemFetchError);
      return NextResponse.json({ error: "Failed validating track" }, { status: 500 });
    }
    if (!existingItem) {
      try {
        const track = await getTrackDetails(trackId);
        const newItem = {
          id: track.id,
          type: 'track' as const,
          name: track.name,
          artist: track.artists?.map((a: any) => a.name).join(', '),
          album: track.album?.name,
          duration_ms: track.duration_ms,
          cover_url: track.album?.images?.[0]?.url ?? null,
          spotify_url: track.external_urls?.spotify,
        };
        const { error: insertItemError } = await supabase
          .from('spotify_items')
          .insert(newItem);
        if (insertItemError) throw insertItemError;
      } catch (e) {
        console.error('Failed to upsert spotify item:', e);
        return NextResponse.json({ error: "Failed to fetch track metadata" }, { status: 500 });
      }
    }

    // Check if track already exists in favorites
    const { data: existingFavorite, error: checkError } = await supabase
      .from("user_favorite_tracks")
      .select("track_id")
      .eq("user_id", user.id)
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
        user_id: user.id,
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
  const user = await getServerUser();
  
  if (!user) {
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
      .eq("user_id", user.id)
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

