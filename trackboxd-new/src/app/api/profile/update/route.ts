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
    const { name, username, country, image_url, spotify_url } = body;

    // Validate required fields
    if (!name || !username) {
      return NextResponse.json(
        { error: "Name and username are required" },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Check if username is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking username:', checkError);
      return NextResponse.json(
        { error: "Failed to check username availability" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        name,
        username,
        country: country || null,
        image_url: image_url || null,
        spotify_url: spotify_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update user profile:', updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        image_url: updatedUser.image_url,
        country: updatedUser.country,
        updated_at: updatedUser.updated_at,
      }
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
