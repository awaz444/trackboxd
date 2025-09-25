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
    const { name, country, image_url, spotify_url, instagram_url } = body; // Remove username

    // Validate required fields - only name is required now
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Validate name format (alphanumeric and underscores only)
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: "Name can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Check if name is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("name", name) // Changed from username to name
      .neq("id", session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking name:', checkError);
      return NextResponse.json(
        { error: "Failed to check name availability" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Name is already taken, please try another one" }, // New error message
        { status: 400 }
      );
    }

    // Update user profile - remove username field
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        name, // Only update name, not username
        country: country || null,
        image_url: image_url || null,
        spotify_url: spotify_url || null,
        instagram_url: instagram_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update user profile:', updateError);
      
      // Handle unique constraint violation for name
      if (updateError.code === '23505' && updateError.details?.includes('name')) {
        return NextResponse.json(
          { error: "Name is already taken, please try another one" },
          { status: 400 }
        );
      }
      
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