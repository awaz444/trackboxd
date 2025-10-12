import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET - Fetch pending follow requests for the current user
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

    // Get pending follow requests (where current user is being followed)
    const { data: requests, error } = await supabase
      .from("follows")
      .select(`
        follower_id,
        created_at,
        follower:users!follows_follower_id_fkey (
          id,
          name,
          image_url
        )
      `)
      .eq("following_id", session.user.id)
      .eq("accepted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching follow requests:', error);
      return NextResponse.json(
        { error: "Failed to fetch follow requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    });
  } catch (error) {
    console.error('Failed to fetch follow requests:', error);
    return NextResponse.json(
      { error: "Failed to fetch follow requests" },
      { status: 500 }
    );
  }
}