import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const supabase = createClient(cookies());

    // Get followers from the database
    const { data: followersData, error: followersError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId);

    if (followersError) {
      console.error("Error fetching followers:", followersError);
      return NextResponse.json(
        { error: "Failed to fetch followers" },
        { status: 500 }
      );
    }

    if (!followersData.length) {
      return NextResponse.json([]);
    }

    // Get user details for each follower
    const followerIds = followersData.map((follow) => follow.follower_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, username, image_url")
      .in("id", followerIds);

    if (usersError) {
      console.error("Error fetching follower details:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch follower details" },
        { status: 500 }
      );
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Unexpected error in followers API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}