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

    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: annotations, error } = await supabase
      .from("annotations")
      .select(`
        id,
        text,
        timestamp,
        like_count,
        created_at,
        track_id,
        spotify_items!annotations_track_id_fkey (
          id,
          name,
          artist,
          cover_url,
          spotify_url
        ),
        users!annotations_user_id_fkey (
          id,
          name,
          image_url,
          username
        )
      `)
      .eq("is_public", true)
      .gte("created_at", fourteenDaysAgo)
      .order("like_count", { ascending: false })
      .limit(5);

    if (error) throw error;

    const formatted = (annotations || []).map((a: any) => ({
      id: a.id,
      text: a.text,
      timestamp: a.timestamp,
      like_count: a.like_count,
      created_at: a.created_at,
      track_id: a.track_id,
      track_name: a.spotify_items?.name,
      artist: a.spotify_items?.artist,
      cover_url: a.spotify_items?.cover_url,
      spotify_url: a.spotify_items?.spotify_url,
      user: {
        id: a.users?.id,
        name: a.users?.name,
        image_url: a.users?.image_url,
        username: a.users?.username,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("popular-annotations error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
