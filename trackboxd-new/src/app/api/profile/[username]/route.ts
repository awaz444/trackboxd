import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from "next/server";
import { getProfileByUsername } from "@/lib/profile-service";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    // Get current user (optional — used for follow status check)
    const currentSupabaseUser = await getServerUser();
    const currentUserId = currentSupabaseUser?.id ?? null;

    const profileData = await getProfileByUsername(username, currentUserId);

    if (!profileData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Failed to fetch profile data:', error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}