import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cookie-less Supabase client for public, cacheable page data.
 *
 * Reading `cookies()` opts a route into dynamic rendering, so every crawler hit
 * re-runs the Spotify and Supabase queries. Public pages read the same rows for
 * everyone, so they use this client and stay statically cacheable (ISR).
 *
 * Callers must filter to public rows themselves (`is_public`), exactly as the
 * cookie-backed client already required.
 */
export const createPublicClient = () =>
  createSupabaseClient(supabaseUrl!, supabaseKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
