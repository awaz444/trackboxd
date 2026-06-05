import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    // Step 1: Get IDs of users that the current user already follows
    const { data: myFollows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .eq("accepted", true);

    const myFriendIds = myFollows?.map((f) => f.following_id) || [];
    const excludeIds = [user.id, ...myFriendIds];

    // If the user follows nobody, fall back to recent unfollowed users
    if (myFriendIds.length === 0) {
      const { data: recentUsers } = await supabase
        .from("users")
        .select("id, name, username, image_url")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(5);

      return NextResponse.json(recentUsers || []);
    }

    // Step 2: Find users followed by my friends, excluding already-followed + self
    const { data: friendFollows } = await supabase
      .from("follows")
      .select("following_id, follower_id")
      .in("follower_id", myFriendIds)
      .not("following_id", "in", `(${excludeIds.join(",")})`)
      .eq("accepted", true)
      .limit(500);

    if (!friendFollows || friendFollows.length === 0) {
      // Fall back to recent unfollowed users
      const { data: recentUsers } = await supabase
        .from("users")
        .select("id, name, username, image_url")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(5);

      return NextResponse.json(recentUsers || []);
    }

    // Step 3: Count mutual connections in JS, take top 5
    const mutualCounts: Record<string, number> = {};
    friendFollows.forEach((f) => {
      mutualCounts[f.following_id] = (mutualCounts[f.following_id] || 0) + 1;
    });

    const topUserIds = Object.entries(mutualCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Step 4: Fetch profiles for the top users
    const { data: users } = await supabase
      .from("users")
      .select("id, name, username, image_url")
      .in("id", topUserIds);

    // Preserve the mutual-count sort order
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));
    const sorted = topUserIds
      .map((id) => userMap.get(id))
      .filter(Boolean)
      .map((u: any) => ({
        ...u,
        mutual_connections: mutualCounts[u.id] || 0,
      }));

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("people-you-may-know error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
