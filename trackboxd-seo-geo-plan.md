# Trackboxd — Complete SEO & GEO Development Plan

---

## What the GEO Data Tells You

Before touching a single file, understand what ChatGPT actually did when someone asked "cool websites to review and annotate tracks."

It issued queries like **"letterboxd for music"**, **"music review annotation site"**, and **"song meaning websites 2026"** — and surfaced Musotic, Musicboard, RYM, Last.fm, CritiqueBrainz, and record.club. Trackboxd was not in those results.

The JSON also shows ChatGPT's entity resolution in real time: it literally wrote `entity["website","Letterboxd","movie review social platform"]` in its internal context before generating the response. That's the comparison frame LLMs use for this query class. If Trackboxd isn't semantically linked to that entity, it won't appear.

The key search queries extracted from the conversation data:
- `"websites to review and annotate tracks"`
- `"letterboxd for music"`
- `"song meaning websites 2026"`
- `"rate your music alternatives 2026"`
- `"musicboard alternatives"`
- `"social music tracking app"`
- `"music annotation platform"`

Every one of those query intents is a surface Trackboxd can own — none of them currently return Trackboxd.

---

## Phase 1 — Semantic Anchoring (Day 1)

This is the fastest, highest-ROI work.

### 1.1 Title Tag and Meta Description

The phrase "Letterboxd for tracks" needs to appear verbatim in your root layout metadata. LLMs do vector similarity on crawled content. If you don't provide the anchor string, the model infers it — and when it infers, it picks the site that already owns the comparison (Musicboard, Musotic).

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Trackboxd — The Letterboxd for Tracks',
    template: '%s | Trackboxd',
  },
  description:
    'Trackboxd is the Letterboxd for tracks. Rate songs, write reviews, annotate lyrics with timestamps, and build a listening diary. The music annotation platform built for people who actually care.',
  keywords: [
    'letterboxd for music',
    'song annotation',
    'music review platform',
    'track diary',
    'letterboxd for tracks',
    'music rating app',
    'song meaning',
  ],
  openGraph: {
    siteName: 'Trackboxd',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@trackboxd',
  },
};
```

### 1.2 Landing Page H1/H2

The landing page must surface the semantic anchor in rendered HTML, not just meta. LLM crawlers parse DOM; they don't exclusively read `<head>`.

```tsx
// src/app/page.tsx — hero section
<h1>The Letterboxd for Tracks</h1>
<h2>Rate songs, annotate lyrics, build your listening diary.</h2>
```

Do not bury this. It must be above the fold, in an `<h1>`, not a styled `<div>`. Semantic HTML is how LLM crawlers extract entity relationships.

### 1.3 About Page

Create `/about` with explicit feature enumeration in prose. LLM crawlers extract this for "what does X do" queries. The GEO data showed ChatGPT actively scraping changelogs and about pages to verify UI/UX claims.

```md
## What Trackboxd does

Trackboxd is a track-first social platform. Unlike Last.fm (which focuses on scrobbling) or RateYourMusic (which is album-focused), Trackboxd is built around individual songs — their lyrics, timestamps, emotional weight, and what they mean to the people who listen to them.

**Core features:**
- Per-track ratings and reviews
- Timestamped annotations on any part of a song
- Listening diary with date logging
- Social profiles showing taste and listening history
- Dark mode interface with high-contrast accent colors
- Server-rendered pages for fast indexing

**Stack:** Next.js 15, TypeScript, PostgreSQL, Tailwind CSS, Vercel
```

That last paragraph — explicitly mentioning "dark mode interface," performance capabilities, and the stack — directly targets the GEO finding that LLMs scrape technical documentation to verify subjective claims like "fast music tracker with dark UI."

---

## Phase 2 — Dynamic Metadata on All Route Types (Days 2–3)

Every dynamic page currently serves the same generic metadata. That needs to change.

### 2.1 Song Pages

```tsx
// src/app/songs/[song_id]/page.tsx
import type { Metadata } from 'next';
import { getSong } from '@/lib/db/songs';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song = await getSong(params.song_id);
  if (!song) return { title: 'Track not found' };

  return {
    title: `${song.title} by ${song.artist}`,
    description: `Ratings, reviews, and annotations for "${song.title}" by ${song.artist}. ${song.reviewCount} reviews on Trackboxd.`,
    openGraph: {
      title: `${song.title} — ${song.artist}`,
      description: `${song.reviewCount} Trackboxd reviews for this track.`,
      images: [
        {
          url: `/api/og/song/${params.song_id}`,
          width: 1200,
          height: 630,
          alt: `${song.title} by ${song.artist} on Trackboxd`,
        },
      ],
    },
    alternates: {
      canonical: `https://trackboxd.com/songs/${params.song_id}`,
    },
  };
}
```

### 2.2 Album Pages

```tsx
// src/app/albums/[album_id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = await getAlbum(params.album_id);
  if (!album) return { title: 'Album not found' };

  return {
    title: `${album.title} by ${album.artist}`,
    description: `${album.trackCount} tracks, ${album.reviewCount} reviews. Rate and annotate every song on ${album.title} by ${album.artist}.`,
    alternates: {
      canonical: `https://trackboxd.com/albums/${params.album_id}`,
    },
    openGraph: {
      images: [{ url: `/api/og/album/${params.album_id}` }],
    },
  };
}
```

### 2.3 Profile Pages

```tsx
// src/app/profile/[username]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getPublicUser(params.username);
  if (!user || user.isPrivate) return { title: 'Profile' };

  return {
    title: `${user.displayName} (@${user.username}) — Trackboxd`,
    description: `${user.displayName} has rated ${user.ratingCount} tracks and written ${user.reviewCount} reviews on Trackboxd.`,
    alternates: {
      canonical: `https://trackboxd.com/profile/${user.username}`,
    },
  };
}
```

---

## Phase 3 — JSON-LD Structured Data (Days 3–4)

This is where GEO optimization diverges from standard SEO. LLMs use schema markup to build knowledge graphs. If your `MusicRecording` schema links to a Spotify URI or MusicBrainz ID, the LLM can cross-reference Trackboxd's data against entities it already knows — which builds trust and citation likelihood.

### 3.1 Song Page — MusicRecording + Review

```tsx
// src/app/songs/[song_id]/JsonLd.tsx
export function SongJsonLd({ song }: { song: Song }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.title,
    byArtist: {
      '@type': 'MusicGroup',
      name: song.artist,
    },
    inAlbum: song.album
      ? {
          '@type': 'MusicAlbum',
          name: song.album.title,
        }
      : undefined,
    // Link to global entity graph — critical for GEO
    sameAs: [
      song.spotifyUri ? `https://open.spotify.com/track/${song.spotifyId}` : null,
      song.musicbrainzId ? `https://musicbrainz.org/recording/${song.musicbrainzId}` : null,
    ].filter(Boolean),
    aggregateRating: song.ratingCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: song.averageRating,
          reviewCount: song.ratingCount,
          bestRating: 10,
          worstRating: 1,
        }
      : undefined,
    // Nest reviews directly — LLMs extract these for "song meaning" queries
    review: song.topReviews?.map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.username,
        url: `https://trackboxd.com/profile/${r.username}`,
      },
      reviewBody: r.body,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 10,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 3.2 Profile Page — ProfilePage Schema

```tsx
export function ProfileJsonLd({ user }: { user: PublicUser }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${user.displayName} on Trackboxd`,
    url: `https://trackboxd.com/profile/${user.username}`,
    mainEntity: {
      '@type': 'Person',
      name: user.displayName,
      identifier: user.username,
      description: `Music listener with ${user.ratingCount} rated tracks on Trackboxd.`,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 3.3 Album Page — MusicAlbum Schema

```tsx
export function AlbumJsonLd({ album }: { album: Album }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.title,
    byArtist: { '@type': 'MusicGroup', name: album.artist },
    numTracks: album.trackCount,
    track: album.tracks.map((t) => ({
      '@type': 'MusicRecording',
      name: t.title,
      url: `https://trackboxd.com/songs/${t.id}`,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: album.averageRating,
      reviewCount: album.reviewCount,
      bestRating: 10,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## Phase 4 — DOM Structure for Annotations (Day 4)

This is Trackboxd's core differentiator and the most GEO-critical piece. The annotation feature is what separates it from every other site in the LLM's result set. But if the DOM fragments the annotation from the source track data, LLM crawlers cannot extract the relationship.

### Structure annotations semantically

```tsx
// Each annotation block
<article
  itemScope
  itemType="https://schema.org/Comment"
  className="annotation-block"
>
  {/* The referenced lyric/timestamp — use semantic elements */}
  <blockquote
    itemProp="about"
    cite={`https://trackboxd.com/songs/${song.id}`}
    className="annotation-source"
  >
    <mark>{annotation.highlightedText}</mark>
    {annotation.timestamp && (
      <time dateTime={`PT${annotation.timestampSeconds}S`}>
        {formatTimestamp(annotation.timestampSeconds)}
      </time>
    )}
  </blockquote>

  {/* The annotation itself — immediately adjacent in DOM */}
  <aside itemProp="text" className="annotation-body">
    <p>{annotation.body}</p>
    <footer>
      <span itemProp="author" itemScope itemType="https://schema.org/Person">
        <a itemProp="url" href={`/profile/${annotation.username}`}>
          <span itemProp="name">{annotation.displayName}</span>
        </a>
      </span>
    </footer>
  </aside>
</article>
```

The `<blockquote>` and `<aside>` must be siblings in the same parent container — not in separate columns or lazy-loaded in different requests. LLM text chunkers split on DOM boundaries; if the lyric and annotation are in different chunks, the relationship is lost.

---

## Phase 5 — Sitemap (Day 5)

Your current sitemap is incomplete. Every public song page, album page, and profile is an indexable URL that's invisible to crawlers.

```tsx
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [songs, albums, profiles] = await Promise.all([
    db.query('SELECT id, updated_at FROM songs ORDER BY updated_at DESC LIMIT 50000'),
    db.query('SELECT id, updated_at FROM albums ORDER BY updated_at DESC'),
    db.query(
      "SELECT username, updated_at FROM users WHERE is_private = false ORDER BY updated_at DESC"
    ),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://trackboxd.com', changeFrequency: 'daily', priority: 1 },
    { url: 'https://trackboxd.com/about', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://trackboxd.com/explore', changeFrequency: 'daily', priority: 0.9 },
  ];

  const songRoutes: MetadataRoute.Sitemap = songs.rows.map((s) => ({
    url: `https://trackboxd.com/songs/${s.id}`,
    lastModified: s.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const albumRoutes: MetadataRoute.Sitemap = albums.rows.map((a) => ({
    url: `https://trackboxd.com/albums/${a.id}`,
    lastModified: a.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const profileRoutes: MetadataRoute.Sitemap = profiles.rows.map((u) => ({
    url: `https://trackboxd.com/profile/${u.username}`,
    lastModified: u.updated_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...songRoutes, ...albumRoutes, ...profileRoutes];
}
```

If your DB has more than 50k songs, split into a sitemap index with `src/app/sitemap/[page]/route.ts` returning paginated sitemaps.

---

## Phase 6 — OG Image Generation (Day 6)

Dynamic OG images are required for social sharing to drive backlinks, which feed SEO and GEO citation likelihood.

```tsx
// src/app/api/og/song/[id]/route.tsx
import { ImageResponse } from 'next/og';
import { getSong } from '@/lib/db/songs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const song = await getSong(params.id);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
          padding: '48px',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ color: '#888', fontSize: 18, marginBottom: 8 }}>trackboxd</div>
        <div style={{ color: '#fff', fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>
          {song?.title}
        </div>
        <div style={{ color: '#aaa', fontSize: 28, marginTop: 16 }}>{song?.artist}</div>
        {song?.averageRating && (
          <div style={{ color: '#e8c84a', fontSize: 22, marginTop: 'auto' }}>
            ★ {song.averageRating.toFixed(1)} · {song.ratingCount} ratings
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

Replicate this pattern for `/api/og/album/[id]` and `/api/og/profile/[username]`.

---

## Phase 7 — SSR Audit (Day 7)

The GEO plan is explicit: LLM crawlers fail on client-side rendering. Run this audit:

```bash
# Check if public pages are server-rendered
curl -s https://trackboxd.com/songs/SOME_ID | grep -c "<article"
# Should return > 0. If 0, the page is CSR and needs to be fixed.
```

Any page that fetches data with `useEffect` or client-side SWR on its initial render is invisible to LLM crawlers. Convert to:

```tsx
// songs/[song_id]/page.tsx — must be a Server Component
export default async function SongPage({ params }: Props) {
  const song = await getSong(params.song_id); // runs on server, not client
  const reviews = await getReviews(params.song_id);

  return (
    <>
      <SongJsonLd song={song} />
      <SongHeader song={song} />
      <ReviewList reviews={reviews} />
    </>
  );
}
```

Interactivity (liking a review, adding to list) goes in Client Components that are children of this Server Component shell. The critical indexed content — song data, reviews, annotations — must be in the server-rendered HTML.

---

## Phase 8 — robots.txt and Crawler Hints

```txt
# public/robots.txt
User-agent: *
Allow: /
Allow: /songs/
Allow: /albums/
Allow: /profile/
Disallow: /api/
Disallow: /settings/
Disallow: /notifications/

Sitemap: https://trackboxd.com/sitemap.xml

# Explicitly allow known LLM crawlers
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /
```

---

## Priority Order Summary

| Priority | Task | Impact | Effort |
|---|---|---|---|
| 1 | Semantic anchor in title/meta/H1 | Very High | 30 min |
| 2 | `generateMetadata()` on all dynamic routes | Very High | 1 day |
| 3 | JSON-LD on song/album/profile pages | Very High | 1 day |
| 4 | SSR audit — convert CSR pages to Server Components | High | 1–2 days |
| 5 | Sitemap with all public entities | High | 4 hours |
| 6 | Annotation DOM structure (blockquote/aside pairing) | High | 4 hours |
| 7 | About page with technical stack documentation | Medium | 2 hours |
| 8 | OG image generation per entity type | Medium | 1 day |
| 9 | robots.txt with LLM crawler allowances | Low | 15 min |

---

## The Competitor Gap

From the GEO data, Musicboard is currently the default answer for "Letterboxd for music" — but it's actively broken (multiple Reddit threads from mid-2026 confirm outages and user exodus). That's your entry point. Users are actively searching for **"musicboard alternatives"** — a query Trackboxd should be ranking for.

To capture that traffic specifically:

1. Write a page at `/blog/musicboard-alternatives` or add content to `/about` addressing this directly.
2. Ensure the annotation feature is called out explicitly in prose as a differentiator from Musicboard, which only supports album/track ratings without inline annotation.
3. CritiqueBrainz (open-source, linked to MusicBrainz) is also being cited. Consider adding a `sameAs` or entity link in your JSON-LD to MusicBrainz IDs — this puts Trackboxd in the same entity graph that LLMs already trust.

The window is open. Musicboard is losing users and the LLM answer for this query class is unsettled. Ship phases 1–4 this week.
