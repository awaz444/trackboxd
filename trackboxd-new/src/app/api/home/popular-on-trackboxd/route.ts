import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const RESULT_SIZE = 5;
// Rolling windows, tried in order until we have enough items to fill the row.
// Ranking is based on real activity rows (likes / reviews / annotations) created
// inside the window, so the section moves with what people are doing now instead
// of being pinned by all-time counters.
const WINDOWS_DAYS = [14, 30, 90];

const WEIGHTS = { like: 2, review: 3, annotation: 2 };

type Supabase = ReturnType<typeof createClient>;

async function scoreWindow(supabase: Supabase, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [likesRes, reviewsRes, annotationsRes] = await Promise.all([
    supabase
      .from("likes")
      .select("target_id")
      .in("target_type", ["track", "album"])
      .gte("created_at", since),
    supabase
      .from("reviews")
      .select("item_id, user_id")
      .eq("is_public", true)
      .gte("created_at", since),
    supabase
      .from("annotations")
      .select("track_id, user_id")
      .eq("is_public", true)
      .gte("created_at", since),
  ]);

  if (likesRes.error) throw likesRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (annotationsRes.error) throw annotationsRes.error;

  const scores = new Map<string, number>();
  const add = (id: string, pts: number) =>
    scores.set(id, (scores.get(id) || 0) + pts);

  // Likes are already unique per (user, item).
  for (const l of likesRes.data || []) add(l.target_id, WEIGHTS.like);

  // Count each person once per item so one user re-reviewing or annotating
  // the same track many times can't push it to the top.
  const seen = new Set<string>();
  for (const r of reviewsRes.data || []) {
    const key = `r:${r.item_id}:${r.user_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    add(r.item_id, WEIGHTS.review);
  }
  for (const a of annotationsRes.data || []) {
    const key = `a:${a.track_id}:${a.user_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    add(a.track_id, WEIGHTS.annotation);
  }

  return scores;
}

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Not authenticated", { status: 401 });
    }

    let scores = new Map<string, number>();
    for (const days of WINDOWS_DAYS) {
      scores = await scoreWindow(supabase, days);
      if (scores.size >= RESULT_SIZE) break;
    }

    // Take a generous slice of candidates: some ids may be playlists or
    // missing from spotify_items, which we filter out below.
    const candidateIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, RESULT_SIZE * 4)
      .map(([id]) => id);

    if (candidateIds.length === 0) return NextResponse.json([]);

    const { data: items, error } = await supabase
      .from("spotify_items")
      .select(
        "id, type, name, artist, cover_url, spotify_url, like_count, review_count, annotation_count, avg_rating, last_updated"
      )
      .in("id", candidateIds)
      .in("type", ["track", "album"]);

    if (error) throw error;

    const ranked = (items || [])
      .map(({ last_updated, ...item }) => ({
        ...item,
        score: scores.get(item.id) || 0,
        _tiebreak: last_updated ? new Date(last_updated).getTime() : 0,
      }))
      // Ties go to the item with the most recent activity.
      .sort((a, b) => b.score - a.score || b._tiebreak - a._tiebreak)
      .slice(0, RESULT_SIZE)
      .map(({ _tiebreak, ...item }) => item);

    return NextResponse.json(ranked);
  } catch (error) {
    console.error("popular-on-trackboxd error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
