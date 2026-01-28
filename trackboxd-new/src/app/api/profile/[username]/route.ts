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
  rating?: number;
  text?: string;
  like_count: number;
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
  spotify_url?: string; // Add spotify_url here
  instagram_url?: string;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    image_url?: string;
    country?: string;
    spotify_url?: string; // Ensure this is included
    instagram_url?: string;
    created_at: string;
    profile_private?: boolean;
  };
  stats: {
    followers: number;
    following: number;
    reviews: number;
    annotations: number;
  };
  favoriteTracks: FavoriteTrack[];
  recentActivity: RecentActivity[];
  likesActivity: Array<{
    id: string;
    timestamp: string;
    sentence: string;
    links: {
      subjectProfile: string;
      targetProfile?: string;
      itemHref?: string;
    };
  }>;
  following: FollowingUser[];
  isFollowing?: boolean;
  followStatus?: 'following' | 'requested' | 'not_following';
  promptResponses?: Array<{
    id: string;
    promptKey: string;
    type: 'text' | 'track' | 'album' | 'playlist';
    item?: { id: string; type: string; name: string; artist?: string; cover_url?: string } | null;
    text?: string | null;
    created_at: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = createClient(cookies());
    const { username } = params;

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

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

    // Check follow status if user is logged in
    let followStatus: 'following' | 'requested' | 'not_following' = 'not_following';
    let isFollowing = false;

    if (currentUserId && currentUserId !== user.id) {
      const { data: followData } = await supabase
        .from("follows")
        .select("accepted")
        .eq("follower_id", currentUserId)
        .eq("following_id", user.id)
        .single();

      if (followData) {
        if (followData.accepted) {
          followStatus = 'following';
          isFollowing = true;
        } else {
          followStatus = 'requested';
        }
      }
    }

    // Get user stats (only count accepted follows)
    const [
      { count: followersCount },
      { count: followingCount },
      { count: reviewsCount },
      { count: annotationsCount },
    ] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
        .eq("accepted", true),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id)
        .eq("accepted", true),
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
            rating: (review as any).rating ?? undefined,
            text: (review as any).text ?? undefined,
            like_count: 0, // Will be updated
          };
          recentActivity.push(activity);
        }
      });
    }

    // Get like counts for reviews
    const reviewIds = recentActivity.filter(a => a.type === "review").map(a => a.id);
    let reviewLikeCounts: Record<string, number> = {};

    if (reviewIds.length > 0) {
      const { data: likeData } = await supabase
        .from("likes")
        .select("target_id")
        .eq("target_type", "review")
        .in("target_id", reviewIds);

      likeData?.forEach(like => {
        reviewLikeCounts[like.target_id] = (reviewLikeCounts[like.target_id] || 0) + 1;
      });

      // Update counts in recentActivity
      recentActivity.forEach(activity => {
        if (activity.type === "review") {
          activity.like_count = reviewLikeCounts[activity.id] || 0;
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
        timestamp,
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
          // Format track timestamp (position in song) as MM:SS
          const trackTimestamp = (annotation as any).timestamp;
          const formatTrackTimestamp = (seconds: number): string => {
            const totalSeconds = Math.floor(seconds);
            const minutes = Math.floor(totalSeconds / 60);
            const remainingSeconds = totalSeconds % 60;
            const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
            return `${minutes}:${paddedSeconds}`;
          };

          const activity: RecentActivity = {
            id: annotation.id,
            type: "annotation",
            track: {
              id: track.id,
              title: track.name,
              artist: track.artist,
              cover_url: track.cover_url,
            },
            timestamp: trackTimestamp !== undefined ? formatTrackTimestamp(trackTimestamp) : "0:00",
            text: (annotation as any).text ?? undefined,
            like_count: 0, // Will be updated
          };
          recentActivity.push(activity);
        }
      });
    }

    // Get like counts for annotations
    const annotationIds = recentActivity.filter(a => a.type === "annotation").map(a => a.id);
    let annotationLikeCounts: Record<string, number> = {};

    if (annotationIds.length > 0) {
      const { data: likeData } = await supabase
        .from("likes")
        .select("target_id")
        .eq("target_type", "annotation")
        .in("target_id", annotationIds);

      likeData?.forEach(like => {
        annotationLikeCounts[like.target_id] = (annotationLikeCounts[like.target_id] || 0) + 1;
      });

      // Update counts in recentActivity
      recentActivity.forEach(activity => {
        if (activity.type === "annotation") {
          activity.like_count = annotationLikeCounts[activity.id] || 0;
        }
      });
    }

    // Get last 20 likes across all target types
    const { data: likesAll, error: likesAllError } = await supabase
      .from("likes")
      .select("id, target_id, target_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const likesActivity: Array<{ id: string; timestamp: string; sentence: string; links: { subjectProfile: string; targetProfile?: string; itemHref?: string; } }> = [];

    if (!likesAllError && likesAll && likesAll.length > 0) {
      const trackLikeIds = likesAll.filter(l => ["track", "album", "playlist"].includes(l.target_type)).map(l => l.target_id);
      const reviewLikeIds = likesAll.filter(l => l.target_type === "review").map(l => l.target_id);
      const annotationLikeIds = likesAll.filter(l => l.target_type === "annotation").map(l => l.target_id);

      // Fetch spotify items for track/album/playlist
      let spotifyMap: Record<string, any> = {};
      if (trackLikeIds.length > 0) {
        const { data: spItems } = await supabase
          .from("spotify_items")
          .select("id, type, name, artist")
          .in("id", trackLikeIds);
        (spItems || []).forEach(it => { spotifyMap[it.id] = it; });
      }

      // Fetch reviews
      let reviewMap: Record<string, any> = {};
      if (reviewLikeIds.length > 0) {
        const { data: revs } = await supabase
          .from("reviews")
          .select(`id, item_id, rating, users(name), spotify_items!reviews_item_id_fkey(id, name, artist)`)
          .in("id", reviewLikeIds);
        (revs || []).forEach(r => { reviewMap[r.id] = r; });
      }

      // Fetch annotations
      let annotationMap: Record<string, any> = {};
      if (annotationLikeIds.length > 0) {
        const { data: ann } = await supabase
          .from("annotations")
          .select(`id, track_id, users(name), spotify_items!annotations_track_id_fkey(id, name, artist)`)
          .in("id", annotationLikeIds);
        (ann || []).forEach(a => { annotationMap[a.id] = a; });
      }

      likesAll.slice(0, 10).forEach(like => {
        const ts = new Date(like.created_at).toLocaleDateString();
        if (["track", "album", "playlist"].includes(like.target_type)) {
          const item = spotifyMap[like.target_id];
          if (item) {
            const sentence = `${user.name} liked ${item.type} ${item.name}${item.artist ? ' by ' + item.artist : ''}`;
            likesActivity.push({
              id: like.id,
              timestamp: ts,
              sentence,
              links: { subjectProfile: `/profile/${user.name}`, itemHref: `/${item.type === 'track' ? 'songs' : item.type + 's'}/${item.id}` }
            });
          }
        } else if (like.target_type === "review") {
          const r = reviewMap[like.target_id];
          if (r) {
            const sp = Array.isArray(r.spotify_items) ? r.spotify_items[0] : r.spotify_items;
            const reviewer = Array.isArray(r.users) ? r.users[0] : r.users;
            const sentence = `${user.name} liked ${reviewer?.name}'s review of ${sp?.name}${sp?.artist ? ' by ' + sp.artist : ''} (${r.rating}★)`;
            likesActivity.push({
              id: like.id,
              timestamp: ts,
              sentence,
              links: {
                subjectProfile: `/profile/${user.name}`,
                targetProfile: reviewer?.name ? `/profile/${reviewer.name}` : undefined,
                itemHref: sp?.id ? `/songs/${sp.id}` : undefined,
              }
            });
          }
        } else if (like.target_type === "annotation") {
          const a = annotationMap[like.target_id];
          if (a) {
            const sp = Array.isArray(a.spotify_items) ? a.spotify_items[0] : a.spotify_items;
            const annotator = Array.isArray(a.users) ? a.users[0] : a.users;
            const sentence = `${user.name} liked ${annotator?.name}'s annotation on ${sp?.name}${sp?.artist ? ' by ' + sp.artist : ''}`;
            likesActivity.push({
              id: like.id,
              timestamp: ts,
              sentence,
              links: {
                subjectProfile: `/profile/${user.name}`,
                targetProfile: annotator?.name ? `/profile/${annotator.name}` : undefined,
                itemHref: sp?.id ? `/songs/${sp.id}` : undefined,
              }
            });
          }
        }
      });
    }

    // Sort all activities by timestamp and take the most recent 20
    const sortedRecentActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    // Get following - include spotify_url and instagram_url in the select
    const { data: following, error: followingError } = await supabase
      .from("follows")
      .select(`
        following_id,
        users!follows_following_id_fkey (
          id,
          name,
          image_url,
          spotify_url,
          instagram_url
        )
      `)
      .eq("follower_id", user.id)
      .eq("accepted", true)
      .order("created_at", { ascending: false })
      .limit(12);

    // Fetch prompt responses for this user
    let promptResponses: Array<{ id: string; promptKey: string; type: 'text' | 'track' | 'album' | 'playlist'; item?: { id: string; type: string; name: string; artist?: string; cover_url?: string } | null; text?: string | null; created_at: string; }> = [];
    try {
      const { data: responses } = await supabase
        .from('user_profile_responses')
        .select(`
          id,
          prompt_key,
          target_type,
          target_id,
          text_response,
          created_at,
          spotify_items:target_id (
            id,
            type,
            name,
            artist,
            cover_url
          )
        `)
        .eq('user_id', user.id);

      promptResponses = (responses || []).map((r: any) => {
        const item = Array.isArray(r.spotify_items) ? r.spotify_items[0] : r.spotify_items;
        return {
          id: r.id,
          promptKey: r.prompt_key,
          type: r.target_type,
          item: item ? { id: item.id, type: item.type, name: item.name, artist: item.artist, cover_url: item.cover_url } : null,
          text: r.text_response || null,
          created_at: r.created_at,
        };
      });
    } catch (e) {
      console.warn('Failed to fetch prompt responses:', e);
    }

    // Format the response with proper typing
    const profileData: ProfileData = {
      user: {
        id: user.id,
        name: user.name,
        image_url: user.image_url || undefined,
        country: user.country || undefined,
        spotify_url: user.spotify_url || undefined, // Include user's spotify_url
        instagram_url: (user as any).instagram_url || undefined,
        created_at: user.created_at,
        profile_private: user.profile_private || false,
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
      likesActivity,

      following: following?.map(f => {
        const u = Array.isArray(f.users) ? f.users[0] : f.users;
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          image_url: u.image_url,
          spotify_url: u.spotify_url || undefined,
          instagram_url: u.instagram_url || undefined
        } as FollowingUser;
      }).filter(Boolean) as FollowingUser[] || [],

      isFollowing,
      followStatus,
      promptResponses,
    };

    // console.log('Profile data fetched:', profileData);

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Failed to fetch profile data:', error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}