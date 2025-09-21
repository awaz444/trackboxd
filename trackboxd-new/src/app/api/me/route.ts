import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getCurrentUserProfile } from "@/lib/oldSpotify";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const userProfile = await getCurrentUserProfile(session.accessToken);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Failed to fetch Spotify user profile:', error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify user profile" },
      { status: 500 }
    );
  }
}