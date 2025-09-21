import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(cookies());
    
    // Get user profile from public.users table
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error('Failed to fetch user profile:', error);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Return user profile data
    return NextResponse.json({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      image_url: userProfile.image_url,
      spotify_url: userProfile.spotify_url,
      country: userProfile.country,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
      last_login: userProfile.last_login
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}