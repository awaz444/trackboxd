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

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        text,
        created_at,
        item_id,
        spotify_items!reviews_item_id_fkey (
          id,
          type,
          name,
          artist,
          cover_url
        ),
        users!reviews_user_id_fkey (
          id,
          name,
          image_url
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;

    const formatted = (reviews || []).map((r: any) => ({
      review_id: r.id,
      rating: r.rating,
      has_text: r.text && r.text.trim().length > 0,
      created_at: r.created_at,
      item_id: r.item_id,
      item_type: r.spotify_items?.type,
      name: r.spotify_items?.name,
      artist: r.spotify_items?.artist,
      cover_url: r.spotify_items?.cover_url,
      user: {
        id: r.users?.id,
        name: r.users?.name,
        image_url: r.users?.image_url,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("new-on-trackboxd error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
