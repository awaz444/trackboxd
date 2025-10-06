import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Get server session for user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    // Get the list of users that the current user already follows
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", session.user.id);

    if (followsError) throw followsError;

    // Create an array of user IDs that the current user already follows
    const followingIds = follows?.map(follow => follow.following_id) || [];
    // Always include the current user's ID to exclude them from results
    const excludeIds = [...followingIds, session.user.id];

    // Fetch 5 most recent users that the current user doesn't follow
    let query = supabase
      .from("users")
      .select("id, name, username, image_url");
    
    // Only add the NOT IN clause if there are IDs to exclude
    if (excludeIds.length > 0) {
query = query.not('id', 'in', `(${excludeIds.join(",")})`);
    } else {
      // If no following IDs, just exclude the current user
      query = query.neq('id', session.user.id);
    }
    
    const { data: recentUsers, error: usersError } = await query
      .order("created_at", { ascending: false })
      .limit(5);

    if (usersError) throw usersError;

    return NextResponse.json(recentUsers);
  } catch (error) {
    console.error("Recent users fetch error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}