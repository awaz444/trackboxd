import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

interface User {
  id: string;
  name: string;
  image_url: string;
}

interface SpotifyItem {
  id: string;
  name: string;
  artist: string;
  cover_url: string;
  spotify_url: string;
  type?: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  item_id: string;
  like_count: number;
  spotify_items: SpotifyItem;
}

interface Annotation {
  id: string;
  text: string;
  timestamp: number;
  track_id: string;
  is_public: boolean;
  like_count: number;
  spotify_items: SpotifyItem;
}

interface Activity {
  id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  created_at: string;
  users: User;
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Get server session for user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    // Get the list of users that the current user follows
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", session.user.id);

    if (followsError) throw followsError;

    // Include the current user's own activities and activities from followed users
    const followedUserIds = follows?.map(follow => follow.following_id) || [];
    const userIds = [session.user.id, ...followedUserIds];

    // Fetch activity data only from followed users (including self)
    const { data: activities, error: activityError } = await supabase
      .from("activity")
      .select(`
        id,
        user_id,
        action,
        target_table,
        target_id,
        created_at,
        users:user_id (id, name, image_url)
      `)
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(20); // Limit for pagination

    if (activityError) throw activityError;
    if (!activities || activities.length === 0) return NextResponse.json([]);

    // Separate review and annotation activities
    const reviewIds: string[] = [];
    const annotationIds: string[] = [];
    
    activities.forEach((activity: any) => {
      if (activity.action === "review" && activity.target_table === "review") {
        reviewIds.push(activity.target_id);
      } else if (activity.action === "annotation" && activity.target_table === "annotation") {
        annotationIds.push(activity.target_id);
      }
    });

    // Fetch reviews with Spotify metadata
    let reviewsData: Review[] = [];
    if (reviewIds.length > 0) {
      const { data: reviews, error: reviewError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          item_id,
          like_count,
          spotify_items!reviews_item_id_fkey (
            id,
            name,
            artist,
            cover_url,
            spotify_url,
            type
          )
        `)
        .in("id", reviewIds);
      
      if (reviewError) throw reviewError;
      reviewsData = reviews as unknown as Review[] || [];
    }

    // Fetch annotations - ONLY PUBLIC ONES with Spotify metadata
    let annotationsData: Annotation[] = [];
    if (annotationIds.length > 0) {
      const { data: annotations, error: annotationError } = await supabase
        .from("annotations")
        .select(`
          id,
          text,
          timestamp,
          track_id,
          is_public,
          like_count,
          spotify_items!annotations_track_id_fkey (
            id,
            name,
            artist,
            cover_url,
            spotify_url,
            type
          )
        `)
        .in("id", annotationIds)
        .eq("is_public", true);
      
      if (annotationError) throw annotationError;
      annotationsData = annotations as unknown as Annotation[] || [];
    }

    // Format activities for frontend using Spotify metadata from database
    const formattedActivities = activities.map((activity: any) => {
      const base = {
        id: activity.id,
        user: activity.users,
        created_at: activity.created_at,
      };

      if (activity.action === "review" && activity.target_table === "review") {
        const review = reviewsData.find(r => r.id === activity.target_id);
        if (!review) return null;
        
        // Use Spotify metadata from database instead of API call
        const spotifyItem = review.spotify_items;
        if (!spotifyItem) return null;

        return {
          ...base,
          type: "review",
          target_id: review.id,
          title: spotifyItem.name,
          artist: spotifyItem.artist,
          cover_url: spotifyItem.cover_url,
          spotify_url: spotifyItem.spotify_url,
          rating: review.rating,
          content: review.text,
          item_id: spotifyItem.id,
          item_type: spotifyItem.type || null,
          like_count: review.like_count,
        };
      }

      if (activity.action === "annotation" && activity.target_table === "annotation") {
        const annotation = annotationsData.find(a => a.id === activity.target_id);
        // Skip if not public or not found
        if (!annotation) return null;
        
        // Use Spotify metadata from database instead of API call
        const spotifyItem = annotation.spotify_items;
        if (!spotifyItem) return null;

        return {
          ...base,
          type: "annotation",
          target_id: annotation.id,
          title: spotifyItem.name,
          artist: spotifyItem.artist,
          cover_url: spotifyItem.cover_url,
          spotify_url: spotifyItem.spotify_url,
          content: annotation.text,
          timestamp: annotation.timestamp,
          item_id: spotifyItem.id,
          item_type: spotifyItem.type || 'track',
          like_count: annotation.like_count,
        };
      }

      // Extend: include likes on reviews/annotations as simple activity entries (optional)
      if (activity.action === 'like') {
        // We can optionally show likes in the feed later
        return null;
      }

      return null;
    });

    // Filter out null values and return
    return NextResponse.json(formattedActivities.filter(activity => activity !== null));
  } catch (error) {
    console.error("Activity fetch error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}