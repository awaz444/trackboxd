import { createPublicClient } from "@/lib/supabase/public";
import { COUNTRIES } from "@/app/profile/[username]/edit/countries";

export interface GlobalActivityItem {
  id: string;
  kind: "review" | "annotation";
  created_at: string;
  text: string | null;
  rating: number | null;
  timestamp: number | null; // seconds into the track, annotations only
  href: string;
  track: { name: string; artist: string; cover_url: string | null };
  user: { name: string; image_url: string | null };
  country: { code: string; name: string } | null;
}

export interface GlobalActivity {
  items: GlobalActivityItem[];
  countries: Array<{ code: string; name: string }>;
}

const countryName = new Map<string, string>(
  (COUNTRIES as Array<{ code: string; name: string }>).map((c) => [c.code, c.name])
);

function toCountry(raw: unknown) {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  const name = countryName.get(code);
  return name ? { code, name } : null;
}

const FEED_SIZE = 12;
const FETCH_PER_KIND = 40;

// Latest public reviews and timestamped comments from members with public
// profiles, newest first, plus the countries they come from. Returns empty
// on any failure so the landing page never breaks.
export async function getGlobalActivity(): Promise<GlobalActivity> {
  try {
    const supabase = createPublicClient();

    const userCols = "id, name, image_url, country, profile_private";
    const [reviewsRes, annotationsRes] = await Promise.all([
      supabase
        .from("reviews")
        .select(
          `id, rating, text, created_at,
           spotify_items!reviews_item_id_fkey (id, type, name, artist, cover_url),
           users!reviews_user_id_fkey (${userCols})`
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(FETCH_PER_KIND),
      supabase
        .from("annotations")
        .select(
          `id, text, timestamp, created_at,
           spotify_items!annotations_track_id_fkey (id, name, artist, cover_url),
           users!annotations_user_id_fkey (${userCols})`
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(FETCH_PER_KIND),
    ]);

    const one = (v: any) => (Array.isArray(v) ? v[0] : v);
    const all: GlobalActivityItem[] = [];

    (reviewsRes.data || []).forEach((r: any) => {
      const track = one(r.spotify_items);
      const user = one(r.users);
      if (!track || !user?.name || user.profile_private) return;
      all.push({
        id: r.id,
        kind: "review",
        created_at: r.created_at,
        text: r.text || null,
        rating: r.rating ?? null,
        timestamp: null,
        href: `/${track.type === "album" ? "albums" : "songs"}/${track.id}`,
        track: { name: track.name, artist: track.artist, cover_url: track.cover_url ?? null },
        user: { name: user.name, image_url: user.image_url ?? null },
        country: toCountry(user.country),
      });
    });

    (annotationsRes.data || []).forEach((a: any) => {
      const track = one(a.spotify_items);
      const user = one(a.users);
      if (!track || !user?.name || user.profile_private) return;
      all.push({
        id: a.id,
        kind: "annotation",
        created_at: a.created_at,
        text: a.text || null,
        rating: null,
        timestamp: typeof a.timestamp === "number" ? a.timestamp : null,
        href: `/annotations/${a.id}`,
        track: { name: track.name, artist: track.artist, cover_url: track.cover_url ?? null },
        user: { name: user.name, image_url: user.image_url ?? null },
        country: toCountry(user.country),
      });
    });

    all.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());

    const seen = new Map<string, { code: string; name: string }>();
    all.forEach((i) => {
      if (i.country && !seen.has(i.country.code)) seen.set(i.country.code, i.country);
    });

    return { items: all.slice(0, FEED_SIZE), countries: Array.from(seen.values()) };
  } catch {
    return { items: [], countries: [] };
  }
}
