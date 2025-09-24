import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Check if current user is following the target user
    const { data: follow, error } = await supabase
      .from("follows")
      .select("follower_id, following_id")
      .eq("follower_id", session.user.id)
      .eq("following_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking follow status:', error);
      return NextResponse.json(
        { error: "Failed to check follow status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isFollowing: !!follow
    });
  } catch (error) {
    console.error('Failed to check follow status:', error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}

