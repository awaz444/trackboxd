import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 20);
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
    const offset = page * limit;

    // Get server session for user authentication
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    // Get the list of users that the current user follows
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followsError) throw followsError;

    // Include the current user's own activities and activities from followed users
    const followedUserIds = follows?.map(follow => follow.following_id) || [];
    const userIds = [user.id, ...followedUserIds];

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
      .range(offset, offset + limit - 1);

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

    const filteredActivities = formattedActivities.filter(
      (activity) => activity !== null
    );

    // --- Add likes from followed users ---
    let likeActivities: any[] = [];
    if (followedUserIds.length > 0) {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: recentLikes } = await supabase
        .from("likes")
        .select(
          "id, user_id, target_type, target_id, created_at, users:user_id (id, name, image_url)"
        )
        .in("user_id", followedUserIds)
        .in("target_type", ["track", "album", "review", "annotation"])
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (recentLikes && recentLikes.length > 0) {
        // Resolve item metadata for track/album likes
        const trackAlbumIds = recentLikes
          .filter((l: any) => l.target_type === "track" || l.target_type === "album")
          .map((l: any) => l.target_id);

        let spotifyItemsMap: Record<string, any> = {};
        if (trackAlbumIds.length > 0) {
          const { data: spotifyItems } = await supabase
            .from("spotify_items")
            .select("id, name, artist, cover_url, type")
            .in("id", trackAlbumIds);
          (spotifyItems || []).forEach((si: any) => {
            spotifyItemsMap[si.id] = si;
          });
        }

        // Resolve review/annotation likes
        const reviewLikeIds = recentLikes
          .filter((l: any) => l.target_type === "review")
          .map((l: any) => l.target_id);
        const annotationLikeIds = recentLikes
          .filter((l: any) => l.target_type === "annotation")
          .map((l: any) => l.target_id);

        let reviewsMap: Record<string, any> = {};
        let annotationsMap: Record<string, any> = {};

        if (reviewLikeIds.length > 0) {
          const { data: reviewItems } = await supabase
            .from("reviews")
            .select(
              "id, spotify_items!reviews_item_id_fkey (id, name, artist, cover_url, type)"
            )
            .in("id", reviewLikeIds);
          (reviewItems || []).forEach((r: any) => {
            reviewsMap[r.id] = r.spotify_items;
          });
        }

        if (annotationLikeIds.length > 0) {
          const { data: annItems } = await supabase
            .from("annotations")
            .select(
              "id, spotify_items!annotations_track_id_fkey (id, name, artist, cover_url)"
            )
            .in("id", annotationLikeIds);
          (annItems || []).forEach((a: any) => {
            annotationsMap[a.id] = a.spotify_items;
          });
        }

        likeActivities = recentLikes.map((l: any) => {
          let spotifyItem: any = null;
          if (l.target_type === "track" || l.target_type === "album") {
            spotifyItem = spotifyItemsMap[l.target_id];
          } else if (l.target_type === "review") {
            spotifyItem = reviewsMap[l.target_id];
          } else if (l.target_type === "annotation") {
            spotifyItem = annotationsMap[l.target_id];
          }
          if (!spotifyItem) return null;

          return {
            id: `like_${l.id}`,
            user: l.users,
            created_at: l.created_at,
            type: "like",
            like_target_type: l.target_type,
            target_id: l.target_id,
            item_id: spotifyItem.id,
            item_type: spotifyItem.type || "track",
            title: spotifyItem.name,
            artist: spotifyItem.artist,
            cover_url: spotifyItem.cover_url,
          };
        }).filter(Boolean);
      }
    }

    // Merge reviews/annotations + likes, sort by created_at, apply limit
    const allActivities = [...filteredActivities, ...likeActivities]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit);

    // --- Sparse feed fallback ---
    const SPARSE_THRESHOLD = 5;
    if (allActivities.length < SPARSE_THRESHOLD) {
      const needed = SPARSE_THRESHOLD - allActivities.length;
      const { data: globalReviews } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          item_id,
          like_count,
          created_at,
          spotify_items!reviews_item_id_fkey (
            id, name, artist, cover_url, spotify_url, type
          ),
          users!reviews_user_id_fkey (id, name, image_url)
        `)
        .eq("is_public", true)
        .not("user_id", "in", `(${userIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(needed);

      const globalActivities = (globalReviews || []).map((r: any) => {
        const si = r.spotify_items;
        if (!si) return null;
        return {
          id: `global_review_${r.id}`,
          user: r.users,
          created_at: r.created_at,
          type: "review",
          target_id: r.id,
          title: si.name,
          artist: si.artist,
          cover_url: si.cover_url,
          spotify_url: si.spotify_url,
          rating: r.rating,
          content: r.text,
          item_id: si.id,
          item_type: si.type || null,
          like_count: r.like_count,
          is_global: true,
        };
      }).filter(Boolean);

      return NextResponse.json([...allActivities, ...globalActivities]);
    }

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error("Activity fetch error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}