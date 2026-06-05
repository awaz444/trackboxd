import { getArtistDetails } from "@/lib/spotify";

/**
 * After a track/album is liked, reviewed, or annotated:
 * 1. Fetch artist genres from Spotify (if not already stored on the item)
 * 2. Store genres + popularity on spotify_items
 * 3. Increment user_interests weights for each genre
 *
 * This runs after the main response — failures are logged but don't affect the user.
 */
export async function enrichItemGenres(
  supabase: any,
  itemId: string,
  primaryArtistId: string | null,
  userId: string
): Promise<void> {
  if (!primaryArtistId) return;

  try {
    // Check if genres are already populated on this item
    const { data: item } = await supabase
      .from("spotify_items")
      .select("genres, popularity")
      .eq("id", itemId)
      .single();

    let genres: string[] = item?.genres ?? [];

    if (genres.length === 0) {
      // Fetch from Spotify Artist API
      const artist = await getArtistDetails(primaryArtistId);
      genres = artist?.genres ?? [];

      if (genres.length > 0 || artist?.popularity != null) {
        await supabase
          .from("spotify_items")
          .update({
            genres,
            popularity: artist?.popularity ?? null,
          })
          .eq("id", itemId);
      }
    }

    if (genres.length > 0) {
      await updateUserInterests(supabase, userId, genres);
    }
  } catch (err) {
    console.error("enrichItemGenres error:", err);
  }
}

async function updateUserInterests(
  supabase: any,
  userId: string,
  genres: string[]
): Promise<void> {
  // Call the RPC for each genre — increments weight atomically
  await Promise.all(
    genres.map((genre) =>
      supabase
        .rpc("upsert_user_interest", {
          p_user_id: userId,
          p_genre: genre,
        })
        .catch((err: any) => console.error("upsert_user_interest error:", err))
    )
  );
}
