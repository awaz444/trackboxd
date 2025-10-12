import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const supabase = createClient(cookies());

    // Get following from the database (only accepted follows)
    const { data: followingData, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .eq("accepted", true);

    if (followingError) {
      console.error("Error fetching following:", followingError);
      return NextResponse.json(
        { error: "Failed to fetch following" },
        { status: 500 }
      );
    }

    if (!followingData.length) {
      return NextResponse.json([]);
    }

    // Get user details for each following
    const followingIds = followingData.map((follow) => follow.following_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, username, image_url")
      .in("id", followingIds);

    if (usersError) {
      console.error("Error fetching following details:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch following details" },
        { status: 500 }
      );
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Unexpected error in following API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}