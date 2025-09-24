import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Define types for recent activity
interface ActivityTrack {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
}

interface RecentActivity {
  id: string;
  type: "like" | "review" | "annotation";
  track: ActivityTrack;
  timestamp: string;
}

interface FavoriteTrack {
  id: string;
  name: string;
  artist: string;
  cover_url?: string;
}

interface FollowingUser {
  id: string;
  name: string;
  image_url?: string;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    image_url?: string;
    country?: string;
    created_at: string;
  };
  stats: {
    followers: number;
    following: number;
    reviews: number;
    annotations: number;
  };
  favoriteTracks: FavoriteTrack[];
  recentActivity: RecentActivity[];
  following: FollowingUser[];
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { username } = params;

    // Get user by name (since we're using name as the identifier now)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("name", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user stats
    const [
      { count: followersCount },
      { count: followingCount },
      { count: reviewsCount },
      { count: annotationsCount },
    ] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id),
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_public", true),
      supabase
        .from("annotations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_public", true),
    ]);

    // Get favorite tracks
    const { data: favoriteTracks, error: tracksError } = await supabase
      .from("user_favorite_tracks")
      .select(`
        track_id,
        spotify_items (
          id,
          name,
          artist,
          cover_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    // Fix recent activity query - use separate queries for different activity types
    const recentActivity: RecentActivity[] = [];

    // Get review activities
    const { data: reviewActivities, error: reviewError } = await supabase
      .from("reviews")
      .select(`
        id,
        user_id,
        item_id,
        rating,
        text,
        created_at,
        spotify_items!reviews_item_id_fkey (
          id,
          name,
          artist,
          cover_url
        )
      `)
      .eq("user_id", user.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!reviewError && reviewActivities) {
      reviewActivities.forEach(review => {
        const track = Array.isArray(review.spotify_items) ? review.spotify_items[0] : review.spotify_items;
        if (track) {
          const activity: RecentActivity = {
            id: review.id,
            type: "review",
            track: {
              id: track.id,
              title: track.name,
              artist: track.artist,
              cover_url: track.cover_url,
            },
            timestamp: new Date(review.created_at).toLocaleDateString(),
          };
          recentActivity.push(activity);
        }
      });
    }

    // Get annotation activities
    const { data: annotationActivities, error: annotationError } = await supabase
      .from("annotations")
      .select(`
        id,
        user_id,
        track_id,
        text,
        created_at,
        spotify_items!annotations_track_id_fkey (
          id,
          name,
          artist,
          cover_url
        )
      `)
      .eq("user_id", user.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!annotationError && annotationActivities) {
      annotationActivities.forEach(annotation => {
        const track = Array.isArray(annotation.spotify_items) ? annotation.spotify_items[0] : annotation.spotify_items;
        if (track) {
          const activity: RecentActivity = {
            id: annotation.id,
            type: "annotation",
            track: {
              id: track.id,
              title: track.name,
              artist: track.artist,
              cover_url: track.cover_url,
            },
            timestamp: new Date(annotation.created_at).toLocaleDateString(),
          };
          recentActivity.push(activity);
        }
      });
    }

    // Get like activities (likes on tracks)
    const { data: likeActivities, error: likeError } = await supabase
      .from("likes")
      .select(`
        id,
        user_id,
        target_id,
        created_at,
        spotify_items!likes_target_id_fkey (
          id,
          name,
          artist,
          cover_url
        )
      `)
      .eq("user_id", user.id)
      .eq("target_type", "track")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!likeError && likeActivities) {
      likeActivities.forEach(like => {
        const track = Array.isArray(like.spotify_items) ? like.spotify_items[0] : like.spotify_items;
        if (track) {
          const activity: RecentActivity = {
            id: like.id,
            type: "like",
            track: {
              id: track.id,
              title: track.name,
              artist: track.artist,
              cover_url: track.cover_url,
            },
            timestamp: new Date(like.created_at).toLocaleDateString(),
          };
          recentActivity.push(activity);
        }
      });
    }

    // Sort all activities by timestamp and take the most recent 20
    const sortedRecentActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    // Get following
    const { data: following, error: followingError } = await supabase
      .from("follows")
      .select(`
        following_id,
        users!follows_following_id_fkey (
          id,
          name,
          image_url
        )
      `)
      .eq("follower_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    // Format the response with proper typing
    const profileData: ProfileData = {
      user: {
        id: user.id,
        name: user.name,
        image_url: user.image_url || undefined,
        country: user.country || undefined,
        created_at: user.created_at,
      },
      stats: {
        followers: followersCount || 0,
        following: followingCount || 0,
        reviews: reviewsCount || 0,
        annotations: annotationsCount || 0,
      },
      favoriteTracks: favoriteTracks?.map(ft => {
        const track = Array.isArray(ft.spotify_items) ? ft.spotify_items[0] : ft.spotify_items;
        if (!track) return null;
        return {
          id: track.id,
          name: track.name,
          artist: track.artist,
          cover_url: track.cover_url
        } as FavoriteTrack;
      }).filter(Boolean) as FavoriteTrack[] || [],
      
      recentActivity: sortedRecentActivity,
      
      following: following?.map(f => {
        const u = Array.isArray(f.users) ? f.users[0] : f.users;
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          image_url: u.image_url
        } as FollowingUser;
      }).filter(Boolean) as FollowingUser[] || [],
    };

    console.log('Profile data fetched:', profileData);

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Failed to fetch profile data:', error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}