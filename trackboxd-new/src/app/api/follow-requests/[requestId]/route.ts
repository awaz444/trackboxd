import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// PUT - Accept a follow request
export async function PUT(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const user = await getServerUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { requestId } = params;
    const supabase = createClient(cookies());

    // Verify the follow request exists and belongs to the current user
    const { data: followRequest, error: checkError } = await supabase
      .from("follows")
      .select("follower_id, following_id, accepted")
      .eq("follower_id", requestId)
      .eq("following_id", user.id)
      .eq("accepted", false)
      .single();

    if (checkError || !followRequest) {
      return NextResponse.json(
        { error: "Follow request not found" },
        { status: 404 }
      );
    }

    // Accept the follow request
    const { error: updateError } = await supabase
      .from("follows")
      .update({ accepted: true })
      .eq("follower_id", requestId)
      .eq("following_id", user.id);

    if (updateError) {
      console.error('Error accepting follow request:', updateError);
      return NextResponse.json(
        { error: "Failed to accept follow request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follow request accepted"
    });
  } catch (error) {
    console.error('Failed to accept follow request:', error);
    return NextResponse.json(
      { error: "Failed to accept follow request" },
      { status: 500 }
    );
  }
}

// DELETE - Reject/remove a follow request
export async function DELETE(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  const user = await getServerUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { requestId } = params;
    const supabase = createClient(cookies());

    // Verify the follow request exists and belongs to the current user
    const { data: followRequest, error: checkError } = await supabase
      .from("follows")
      .select("follower_id, following_id, accepted")
      .eq("follower_id", requestId)
      .eq("following_id", user.id)
      .eq("accepted", false)
      .single();

    if (checkError || !followRequest) {
      return NextResponse.json(
        { error: "Follow request not found" },
        { status: 404 }
      );
    }

    // Delete the follow request
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", requestId)
      .eq("following_id", user.id);

    if (deleteError) {
      console.error('Error rejecting follow request:', deleteError);
      return NextResponse.json(
        { error: "Failed to reject follow request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follow request rejected"
    });
  } catch (error) {
    console.error('Failed to reject follow request:', error);
    return NextResponse.json(
      { error: "Failed to reject follow request" },
      { status: 500 }
    );
  }
}