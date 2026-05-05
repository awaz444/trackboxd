Trackboxd Task Plan
Task 1 — Search Error Handling
Difficulty: 1/5 (Easy)

The search page at src/app/search/page.tsx currently has no graceful error state. The fix is purely UI — wrap the fetch in try/catch, add an error state variable, and render a soft, neutral message (no red) like "Something went wrong — try again in a bit." using the app's existing muted palette. No backend changes needed.

Task 2 — API Folder Structure Cleanup
Difficulty: 2/5 (Easy-Medium)

The current structure has a few smell spots:

api/search/all, api/search/tracksAlbumsAndPlaylists, api/search/tracksAndAlbums — three separate search routes where one consolidated route with query params would do
api/songs/ uses the word "songs" but every other part of the app calls them "tracks" — api/tracks/ is more consistent
api/review/ and api/annotate/ are singular and verb-form — they should be plural nouns: api/reviews/ and api/annotations/
api/like/track, api/like/album, etc. are fine but api/likes/ as a parent is cleaner
api/sporitfy-auth/route.ts has a typo ("sporitfy")
api/users/ and api/profile/ overlap — user-specific lookups (followers, following) could live under api/users/ and profile data under api/profile/
The work is mostly renaming folders and updating every fetch('/api/...') call across components. No logic changes. Medium effort due to breadth.

Task 3 — Auth / Session Expiry Fix
Difficulty: 3/5 (Medium)

Your NextAuth config at src/lib/authOptions.ts sets maxAge: 30 * 24 * 60 * 60 (30 days) for both JWT and session — that part is fine. The root issue is the dual-auth architecture:

NextAuth manages its own JWT cookie (30-day life)
Supabase browser client (createBrowserClient in src/lib/supabase/client.ts) manages its own separate session cookie — which defaults to 1 hour Supabase JWT expiry
The auth-server client has autoRefreshToken: false, persistSession: false, so Supabase never auto-refreshes
Any component using the Supabase browser client directly for auth checks will think the user is unauthenticated after ~1 hour. The fix is to either: (a) ensure all auth checks go through NextAuth useSession only and Supabase is used purely as a data client with the service role key, or (b) enable Supabase session persistence and auto-refresh in the browser client and sync it with NextAuth on login. Option (a) is cleaner given your current architecture.

Task 4 — SEO Improvements
Difficulty: 3/5 (Medium)

Your root layout has solid base metadata. What's missing:

Dynamic metadata — songs/[song_id]/page.tsx, albums/[album_id]/page.tsx, and profile/[username]/page.tsx need export async function generateMetadata() returning song/album/user-specific titles, descriptions, and OG images
Sitemap — src/app/sitemap.ts only lists home and about. It needs to query your DB for all public profiles, songs, and albums and include them (with lastModified)
Structured data — Song pages should emit MusicRecording JSON-LD, album pages MusicAlbum, profile pages Person. This is what Google uses for rich results
Canonical URLs — Each dynamic page needs a <link rel="canonical"> to prevent duplicate indexing
OG images per page — Next.js has a built-in opengraph-image.tsx route that can generate dynamic OG images per song/album/profile using their data
Task 5 — Instagram Story / Reel Share Card
Difficulty: 4.5/5 (Hard)

This requires generating a pixel-perfect styled image server-side. The recommended approach for Next.js is @vercel/og (built on Satori) — it takes JSX and renders it as a PNG without a browser.

The plan:

Create an API route api/share/story/route.ts that accepts a type (review/annotation), id, and returns a PNG
Design the card in JSX matching the app theme (#1F2C24 background, #FFFBeb text, app fonts) — it includes: track/album artwork, title, artist, the review or annotation text, star rating (for reviews), username + avatar, and the Trackboxd logo watermark
Add a "Share" button on ReviewCard and AnnotationCard components that opens a share sheet
The share sheet has an "Instagram Story" option that fetches the image, lets the user preview it, and triggers a download (Instagram doesn't allow direct posting via web — you download and then upload manually, same as Twitter/X does)
Optionally: a "Copy link" option that generates a shareable URL for the review/annotation page (which also improves SEO)
The hard parts are: getting the card design pixel-perfect, handling long text gracefully (truncation), font loading in Satori, and making the download flow smooth on mobile.

Summary Table
#	Task	Difficulty	Estimated Effort
1	Search graceful error UI	1/5	30 min
2	API folder restructure	2/5	2–3 hrs
3	Auth session fix	3/5	1–2 hrs
4	SEO improvements	3/5	3–4 hrs
5	Instagram story card	4.5/5	6–10 hrs
The ordering above is optimal: quick UI fix first, then structural cleanup before anything else touches the API, auth fix next (since everything depends on it working right), SEO after (benefits from dynamic pages being stable), and the share card last since it's a greenfield feature that builds on the rest.

Let me know which tasks you want to tackle first and I'll get started.