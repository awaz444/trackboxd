import { revalidatePath } from "next/cache";

/**
 * Song, album, review and annotation pages are cached for a day so crawlers
 * do not re-render them every hour. When someone writes, edits or deletes a
 * review or annotation, rebuild the affected pages straight away instead.
 *
 * `itemId` is a Spotify id; we do not always know whether it is a track or an
 * album, so both paths are revalidated (a path with no page is a no-op).
 */
export function revalidateItemPages(itemId?: string | null, extraPaths: string[] = []) {
    try {
        if (itemId) {
            revalidatePath(`/songs/${itemId}`);
            revalidatePath(`/albums/${itemId}`);
        }
        for (const path of extraPaths) revalidatePath(path);
    } catch (error) {
        // Never fail the user's write because a cache purge failed.
        console.error("revalidateItemPages failed:", error);
    }
}
