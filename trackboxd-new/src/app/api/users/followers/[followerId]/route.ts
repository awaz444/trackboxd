import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function DELETE(
  request: Request,
  { params }: { params: { followerId: string } }
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
    const followerId = params.followerId;
    const supabase = createClient(cookies());

    // Remove the follower relationship
    // This is removing where the follower_id is the specified user and following_id is the current user
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", currentUserId);

    if (error) {
      console.error("Error removing follower:", error);
      return NextResponse.json(
        { error: "Failed to remove follower" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in remove follower API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}