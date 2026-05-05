import { getServerUser } from "@/lib/supabase/get-server-user";
import { getTrackDetails } from "@/lib/spotify";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


// Workaround for Next.js 13 App Router limitation
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { song_id: string } }
) {

  const user = await getServerUser();

  if (!user) {
      return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
      );
  }


  try {
    const param = await params;
    const trackId = param.song_id;

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      );
    }

    // 1. Get track details from Spotify
    const trackDetails = await getTrackDetails(trackId);

    // 2. Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 3. Get stats from Supabase
    const { data: stats, error: supabaseError } = await supabase
      .from('spotify_items')
      .select('*')
      .eq('id', trackId)
      .single();

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      // Continue with default stats if Supabase query fails
    }

    // 4. Merge data
    const enrichedTrack = {
      ...trackDetails,
      stats: stats || {
        like_count: 0,
        review_count: 0,
        annotation_count: 0,
        avg_rating: 0
      }
    };

    return NextResponse.json(enrichedTrack);

  } catch (error) {
    console.error("Failed to fetch track details:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: "Failed to fetch track details",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}