import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { getServerUser } from "./get-server-user";

/**
 * Resolve the signed-in user for an API request, on the server only.
 *
 * Order:
 *   1. `Authorization: Bearer <access token>` — validated with Supabase Auth.
 *   2. The Supabase session cookie (what the web app sends on same-origin fetches).
 *
 * Never trust a `userId` from the request body or query string: anyone can put
 * any id there. Routes must act on the id this returns.
 */
export async function getRequestUser(req: Request): Promise<User | null> {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice("Bearer ".length).trim();
        if (token) {
            const supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) return user;
            // An invalid token falls through to the cookie session.
        }
    }

    return getServerUser();
}
