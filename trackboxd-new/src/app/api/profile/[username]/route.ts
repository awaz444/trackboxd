import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { username } = params;

    // Get user by username
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

    const { data: recentActivity, error: activityError } = await supabase
  .from("activity")
  .select(`
    id,
    action,
    created_at,
    target_id,
    target_table,
    reviews:reviews!activity_target_id_fkey (
      item_id,
      spotify_items!reviews_item_id_fkey (
        id,
        name,
        artist,
        cover_url
      )
    ),
    annotations:annotations!activity_target_id_fkey (
      track_id,
      spotify_items!annotations_track_id_fkey (
        id,
        name,
        artist,
        cover_url
      )
    )
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(20);

// Get following with correct relationship syntax
const { data: following, error: followingError } = await supabase
  .from("follows")
  .select(`
    following:users!follows_following_id_fkey (
      id,
      username,
      name,
      image_url
    )
  `)
  .eq("follower_id", user.id)
  .order("created_at", { ascending: false })
  .limit(12);

// Format the response
const profileData = {
  user: {
    id: user.id,
    name: user.name,
    username: user.username,
    image_url: user.image_url,
    country: user.country,
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
    return track ? {
      id: track.id,
      name: track.name,
      artist: track.artist,
      cover_url: track.cover_url,
    } : null;
  }).filter(Boolean) || [],
  
  recentActivity: recentActivity?.map(activity => {
    let track = null;
    if (activity.target_table === 'review' && activity.reviews) {
      const review = Array.isArray(activity.reviews) ? activity.reviews[0] : activity.reviews;
      track = review?.spotify_items;
    } else if (activity.target_table === 'annotation' && activity.annotations) {
      const annotation = Array.isArray(activity.annotations) ? activity.annotations[0] : activity.annotations;
      track = annotation?.spotify_items;
    }
    
    track = Array.isArray(track) ? track[0] : track;
    
    return {
      id: activity.id,
      type: activity.action,
      track: track ? {
        id: track.id,
        title: track.name,
        artist: track.artist,
        cover_url: track.cover_url,
      } : null,
      timestamp: new Date(activity.created_at).toLocaleDateString(),
    };
  }) || [],
  
  following: following?.map(f => {
    const u = Array.isArray(f.following) ? f.following[0] : f.following;
    return u ? {
      id: u.id,
      username: u.username,
      name: u.name,
      image_url: u.image_url,
    } : null;
  }).filter(Boolean) || [],
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
