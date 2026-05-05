import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getServerUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "Following ID is required" },
        { status: 400 }
      );
    }

    if (followingId === user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Check if already following or have a pending request
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("follower_id, following_id, accepted")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing follow:', checkError);
      return NextResponse.json(
        { error: "Failed to check existing follow" },
        { status: 500 }
      );
    }

    if (existingFollow) {
      if (existingFollow.accepted) {
        return NextResponse.json(
          { error: "Already following this user" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Follow request already sent" },
          { status: 400 }
        );
      }
    }

    // Check if the target user has a private profile
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("profile_private")
      .eq("id", followingId)
      .single();

    if (userError) {
      console.error('Error fetching target user:', userError);
      return NextResponse.json(
        { error: "Failed to fetch user information" },
        { status: 500 }
      );
    }

    // Create follow relationship with appropriate accepted status
    const accepted = !targetUser.profile_private; // true for public profiles, false for private
    
    const { data: newFollow, error: insertError } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: followingId,
        accepted: accepted,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create follow:', insertError);
      return NextResponse.json(
        { error: "Failed to follow user" },
        { status: 500 }
      );
    }

    // Create notification for the user being followed
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: followingId,
        type: "follow",
        source_id: user.id,
        is_read: false
      });
      
    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      follow: newFollow,
      isRequest: !accepted // true if it's a follow request, false if immediate follow
    });
  } catch (error) {
    console.error('Failed to follow user:', error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getServerUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "Following ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(cookies());

    // Remove follow relationship
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (deleteError) {
      console.error('Failed to remove follow:', deleteError);
      return NextResponse.json(
        { error: "Failed to unfollow user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

