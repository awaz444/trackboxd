import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Anonymous requests — crawlers included — carry no Supabase auth cookie, so
  // there is no token to refresh. Returning early skips the auth round-trip and
  // leaves the response cacheable, instead of marking it `private, no-store`.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasAuthCookie) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the access token from the refresh token cookie when it expires.
  // Must use getUser(), not getSession() — getUser() validates server-side.
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Vercel bills every middleware invocation, including the early return above,
// and before this change it ran on nearly every request (crawlers included).
// It only has work to do when a signed-in user hits a server route that reads
// the session, so the matcher now requires both:
// - the Supabase auth cookie. @supabase/ssr names it sb-<project ref>-auth-token
//   and splits it into .0/.1 chunks when large, so both names are listed.
//   UPDATE THE REF HERE if the app moves to another Supabase project, or
//   sessions will stop refreshing on the server.
// - an API route (except the /api/share/ preview images), or one of the pages
//   that call getServerUser() while rendering: /my-likes, /profile/*,
//   /journals/*. Every other page is static or reads the user in the browser,
//   where the Supabase browser client refreshes the token itself.
// Matcher values must be literals: Next.js reads them at build time.
export const config = {
  matcher: [
    {
      source: "/((?:api/(?!share/)|my-likes|profile/|journals/).*)",
      has: [{ type: "cookie", key: "sb-qufdjlaxzyarnrsiimfw-auth-token" }],
    },
    {
      source: "/((?:api/(?!share/)|my-likes|profile/|journals/).*)",
      has: [{ type: "cookie", key: "sb-qufdjlaxzyarnrsiimfw-auth-token.0" }],
    },
  ],
};
