import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTrackDetails } from "@/lib/spotify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

interface User {
  id: string;
  name: string;
  image_url: string;
}

interface SpotifyItem {
  id: string;
  cover_url: string;
  spotify_url: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  item_id: string;
  spotify_items: SpotifyItem[];
}

interface Annotation {
  id: string;
  text: string;
  timestamp: number;
  track_id: string;
  is_public: boolean;
  spotify_items: SpotifyItem[];
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
    // Get server session for Spotify access
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return new NextResponse("Not authenticated", { status: 401 });
    }
    const accessToken = session.accessToken;

    // Fetch activity data
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
      .order("created_at", { ascending: false })
      .limit(50);

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

    // Fetch reviews
    let reviewsData: Review[] = [];
    if (reviewIds.length > 0) {
      const { data: reviews, error: reviewError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          item_id,
          spotify_items (id, cover_url, spotify_url)
        `)
        .in("id", reviewIds);
      
      if (reviewError) throw reviewError;
      reviewsData = reviews as unknown as Review[] || [];
    }

    // Fetch annotations - ONLY PUBLIC ONES
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
          spotify_items:track_id (id, cover_url, spotify_url)
        `)
        .in("id", annotationIds)
        .eq("is_public", true);  // ONLY PUBLIC ANNOTATIONS
      
      if (annotationError) throw annotationError;
      annotationsData = annotations as unknown as Annotation[] || [];
    }

    // Format activities for frontend
    const formattedActivities = await Promise.all(
      activities.map(async (activity: any) => {
        const base = {
          id: activity.id,
          user: activity.users,
          created_at: activity.created_at,
        };

        if (activity.action === "review" && activity.target_table === "review") {
          const review = reviewsData.find(r => r.id === activity.target_id);
          if (!review) return null;
          
          try {
            // Fetch track details from Spotify
            const trackDetails = await getTrackDetails(review.item_id);
            
            return {
              ...base,
              type: "review",
              title: trackDetails.name,
              artist: trackDetails.artists.map((a: any) => a.name).join(", "),
              cover_url: trackDetails.album.images[0]?.url,
              spotify_url: trackDetails.external_urls.spotify,
              rating: review.rating,
              content: review.text,
            };
          } catch (error) {
            console.error("Error fetching track details:", error);
            return null;
          }
        }

        if (activity.action === "annotation" && activity.target_table === "annotation") {
          const annotation = annotationsData.find(a => a.id === activity.target_id);
          // Skip if not public or not found
          if (!annotation || !annotation.is_public) return null;
          
          try {
            // Fetch track details from Spotify
            const trackDetails = await getTrackDetails(annotation.track_id);
            
            return {
              ...base,
              type: "annotation",
              title: trackDetails.name,
              artist: trackDetails.artists.map((a: any) => a.name).join(", "),
              cover_url: trackDetails.album.images[0]?.url,
              spotify_url: trackDetails.external_urls.spotify,
              content: annotation.text,
              timestamp: annotation.timestamp,
            };
          } catch (error) {
            console.error("Error fetching track details:", error);
            return null;
          }
        }

        return null;
      })
    );

    // Filter out null values and return
    return NextResponse.json(formattedActivities.filter(activity => activity !== null));
  } catch (error) {
    console.error("Activity fetch error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}