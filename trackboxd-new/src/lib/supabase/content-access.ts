import type { SupabaseClient } from "@supabase/supabase-js";

export interface ContentAccess {
    /** The viewer is the owner: they see everything, private rows included. */
    isOwner: boolean;
    /**
     * The viewer may see the owner's public content: own profile, a public
     * profile, or an accepted follower of a private one. Same rule as the
     * profile page (`resolveProfileAccess` in lib/profile-service.ts).
     */
    canView: boolean;
}

/**
 * Decide what `viewerId` may see of `ownerId`'s reviews, annotations, likes,
 * journals and follows.
 *
 * API routes run with the service role key, so RLS does not filter reads:
 * every route that lists a user's content must call this and then
 *   - return nothing when `canView` is false, and
 *   - filter to `is_public = true` unless `isOwner`.
 *
 * An unknown owner id gives `canView: false`.
 */
export async function getContentAccess(
    supabase: SupabaseClient<any, any, any> | any,
    ownerId: string,
    viewerId: string | null | undefined
): Promise<ContentAccess> {
    if (viewerId && viewerId === ownerId) {
        return { isOwner: true, canView: true };
    }

    const { data: owner } = await supabase
        .from("users")
        .select("profile_private")
        .eq("id", ownerId)
        .maybeSingle();

    if (!owner) return { isOwner: false, canView: false };
    if (!owner.profile_private) return { isOwner: false, canView: true };
    if (!viewerId) return { isOwner: false, canView: false };

    return { isOwner: false, canView: await isAcceptedFollower(supabase, viewerId, ownerId) };
}

/**
 * `canView` only, for hot paths that don't need `isOwner` (the "has this user
 * liked X" checks). The viewer is resolved only when the owner's profile is
 * private, so public profiles cost one query and no auth round trip.
 */
export async function canViewUserContent(
    supabase: SupabaseClient<any, any, any> | any,
    ownerId: string,
    resolveViewerId: () => Promise<string | null | undefined>
): Promise<boolean> {
    const { data: owner } = await supabase
        .from("users")
        .select("profile_private")
        .eq("id", ownerId)
        .maybeSingle();

    if (!owner) return false;
    if (!owner.profile_private) return true;

    const viewerId = await resolveViewerId();
    if (!viewerId) return false;
    if (viewerId === ownerId) return true;
    return isAcceptedFollower(supabase, viewerId, ownerId);
}

async function isAcceptedFollower(
    supabase: SupabaseClient<any, any, any> | any,
    followerId: string,
    followingId: string
): Promise<boolean> {
    const { data: follow } = await supabase
        .from("follows")
        .select("accepted")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();
    return !!follow?.accepted;
}
