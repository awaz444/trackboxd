import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trackboxd.com'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [tracksResult, albumsResult, usersResult] = await Promise.all([
    supabase
      .from('spotify_items')
      .select('id')
      .eq('type', 'track')
      .limit(50000),
    supabase
      .from('spotify_items')
      .select('id')
      .eq('type', 'album'),
    supabase
      .from('users')
      .select('name')
      .eq('profile_private', false),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
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
  ]

  const trackRoutes: MetadataRoute.Sitemap = (tracksResult.data || []).map((t) => ({
    url: `${baseUrl}/songs/${t.id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const albumRoutes: MetadataRoute.Sitemap = (albumsResult.data || []).map((a) => ({
    url: `${baseUrl}/albums/${a.id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const profileRoutes: MetadataRoute.Sitemap = (usersResult.data || []).map((u) => ({
    url: `${baseUrl}/profile/${encodeURIComponent(u.name)}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...trackRoutes, ...albumRoutes, ...profileRoutes]
}
