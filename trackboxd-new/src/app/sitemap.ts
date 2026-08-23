import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'

// Refresh the sitemap hourly rather than rebuilding it on every crawler request.
export const revalidate = 3600

/** Pages with real activity get a higher priority than empty stubs. */
const engagementPriority = (item: {
  review_count?: number | null
  annotation_count?: number | null
  like_count?: number | null
}) => {
  const activity =
    (item.review_count ?? 0) + (item.annotation_count ?? 0) + (item.like_count ?? 0)
  if (activity >= 10) return 0.9
  if (activity >= 3) return 0.8
  if (activity >= 1) return 0.7
  return 0.5
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [tracksResult, albumsResult, usersResult, reviewsResult, annotationsResult] =
    await Promise.all([
      supabase
        .from('spotify_items')
        .select('id, last_updated, review_count, annotation_count, like_count')
        .eq('type', 'track')
        .limit(50000),
      supabase
        .from('spotify_items')
        .select('id, last_updated, review_count, annotation_count, like_count')
        .eq('type', 'album'),
      supabase
        .from('users')
        .select('name, updated_at')
        .eq('profile_private', false),
      supabase
        .from('reviews')
        .select('id, updated_at')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(10000),
      supabase
        .from('annotations')
        .select('id, updated_at')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(10000),
    ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tracks`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/letterboxd-for-music`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/alternatives`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/song-annotations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const trackRoutes: MetadataRoute.Sitemap = (tracksResult.data || []).map((t) => ({
    url: `${baseUrl}/songs/${t.id}`,
    lastModified: t.last_updated ? new Date(t.last_updated) : undefined,
    changeFrequency: 'weekly',
    priority: engagementPriority(t),
  }))

  const albumRoutes: MetadataRoute.Sitemap = (albumsResult.data || []).map((a) => ({
    url: `${baseUrl}/albums/${a.id}`,
    lastModified: a.last_updated ? new Date(a.last_updated) : undefined,
    changeFrequency: 'weekly',
    priority: engagementPriority(a),
  }))

  const profileRoutes: MetadataRoute.Sitemap = (usersResult.data || []).map((u) => ({
    url: `${baseUrl}/profile/${encodeURIComponent(u.name)}`,
    lastModified: u.updated_at ? new Date(u.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Individual reviews and annotations are the site's most distinctive content —
  // they are the pages nothing else on the web duplicates.
  const reviewRoutes: MetadataRoute.Sitemap = (reviewsResult.data || []).map((r) => ({
    url: `${baseUrl}/reviews/${r.id}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const annotationRoutes: MetadataRoute.Sitemap = (annotationsResult.data || []).map((a) => ({
    url: `${baseUrl}/annotations/${a.id}`,
    lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...trackRoutes,
    ...albumRoutes,
    ...profileRoutes,
    ...reviewRoutes,
    ...annotationRoutes,
  ]
}
