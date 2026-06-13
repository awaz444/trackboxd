import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { readFileSync } from 'fs'
import { join } from 'path'

export type ShareCardType = 'review' | 'annotation'

export interface ShareCardData {
  type: ShareCardType
  trackName: string
  artistName: string
  albumName: string
  contentText: string
  username: string
  rating: number
  timestamp: number
  coverDataUrl: string
  avatarDataUrl: string
  logoDataUrl: string
  fontRegular: Buffer
  fontBold: Buffer
}

async function fetchAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = await res.arrayBuffer()
    const ct = res.headers.get('content-type') || 'image/jpeg'
    return `data:${ct};base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return ''
  }
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export async function loadShareCardData(
  type: ShareCardType,
  id: string
): Promise<ShareCardData | null> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  let trackName = ''
  let artistName = ''
  let albumName = ''
  let coverUrl = ''
  let contentText = ''
  let username = ''
  let avatarUrl = ''
  let rating = 0
  let timestamp = 0

  if (type === 'review') {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, text, is_public, item_id,
        users:user_id (id, name, image_url),
        spotify_items!reviews_item_id_fkey (id, name, artist, album, cover_url)
      `)
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error || !data) return null

    const d = data as any
    trackName = d.spotify_items?.name || 'Unknown Track'
    artistName = d.spotify_items?.artist || 'Unknown Artist'
    albumName = d.spotify_items?.album || ''
    coverUrl = d.spotify_items?.cover_url || ''
    contentText = d.text || ''
    username = d.users?.name || 'trackboxd user'
    avatarUrl = d.users?.image_url || ''
    rating = d.rating || 0
  } else {
    const { data, error } = await supabase
      .from('annotations')
      .select(`
        id, text, timestamp, is_public, track_id,
        users:user_id (id, name, image_url),
        spotify_items!annotations_track_id_fkey (id, name, artist, album, cover_url)
      `)
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error || !data) return null

    const d = data as any
    trackName = d.spotify_items?.name || 'Unknown Track'
    artistName = d.spotify_items?.artist || 'Unknown Artist'
    albumName = d.spotify_items?.album || ''
    coverUrl = d.spotify_items?.cover_url || ''
    contentText = d.text || ''
    username = d.users?.name || 'trackboxd user'
    avatarUrl = d.users?.image_url || ''
    timestamp = d.timestamp || 0
  }

  const defaultAvatarPath = join(process.cwd(), 'public', 'default-avatar.jpg')

  const [coverDataUrl, avatarDataUrlRaw] = await Promise.all([
    coverUrl ? fetchAsBase64(coverUrl) : Promise.resolve(''),
    avatarUrl ? fetchAsBase64(avatarUrl) : Promise.resolve(''),
  ])

  const fallbackAvatar = `data:image/jpeg;base64,${readFileSync(defaultAvatarPath).toString('base64')}`
  const avatarDataUrl = avatarDataUrlRaw || fallbackAvatar

  const fontRegular = readFileSync(join(process.cwd(), 'public', 'fonts', 'Lora-Regular copy.ttf'))
  const fontBold = readFileSync(join(process.cwd(), 'public', 'fonts', 'Lora-Bold copy.ttf'))
  const logoBuffer = readFileSync(join(process.cwd(), 'public', 'trackboxd-logo.png'))
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return {
    type,
    trackName,
    artistName,
    albumName,
    contentText,
    username,
    rating,
    timestamp,
    coverDataUrl,
    avatarDataUrl,
    logoDataUrl,
    fontRegular,
    fontBold,
  }
}
