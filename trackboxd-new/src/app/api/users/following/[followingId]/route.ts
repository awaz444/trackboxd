import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: { followingId: string } }
) {
  try {
    // Get the current user from the session
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const currentUserId = user.id;
    const followingId = params.followingId;
    const supabase = createClient(cookies());

    // Remove the following relationship
    // This is removing where the follower_id is the current user and following_id is the specified user
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", followingId);

    if (error) {
      console.error("Error unfollowing user:", error);
      return NextResponse.json(
        { error: "Failed to unfollow user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in unfollow API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}