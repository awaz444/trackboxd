import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}


function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !id || !['review', 'annotation'].includes(type)) {
    return new Response('Missing or invalid params', { status: 400 })
  }

  try {
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

      if (error || !data) return new Response('Not found', { status: 404 })

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

      if (error || !data) return new Response('Not found', { status: 404 })

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

    // Load external images and local assets in parallel
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

    const displayText = truncate(contentText, 280)
    const displayTrack = truncate(trackName, 42)
    const displayArtist = truncate(artistName, 52)

    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1920px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFBEb',
            fontFamily: 'Lora',
            padding: '88px 80px 72px',
          }}
        >
          {/* Main content — vertically centered in remaining space above footer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Cover art */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '56px' }}>
              {coverDataUrl ? (
                <img
                  src={coverDataUrl}
                  style={{ width: '480px', height: '480px', borderRadius: '24px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '480px',
                    height: '480px',
                    backgroundColor: '#E8E4D9',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ display: 'flex', fontSize: '80px', color: '#5C5537', opacity: 0.2 }}>?</div>
                </div>
              )}
            </div>

            {/* Track name */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: '52px',
                  fontWeight: 700,
                  color: '#1F2C24',
                  textAlign: 'center',
                  lineHeight: 1.15,
                }}
              >
                {displayTrack}
              </div>
            </div>

            {/* Artist */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: albumName ? '8px' : '0px' }}>
              <div style={{ display: 'flex', fontSize: '32px', color: '#5C5537', opacity: 0.65, textAlign: 'center' }}>
                {displayArtist}
              </div>
            </div>

            {/* Album */}
            {albumName ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '26px',
                    color: '#5C5537',
                    opacity: 0.42,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {truncate(albumName, 52)}
                </div>
              </div>
            ) : null}

            {/* Rating pills (review) or timestamp (annotation) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }}>
              {type === 'review' ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const fill = Math.max(0, Math.min(1, rating - i))
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          width: '72px',
                          height: '12px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(92,85,55,0.12)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            width: `${fill * 100}%`,
                            height: '100%',
                            backgroundColor: '#FFBA00',
                          }}
                        />
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', fontSize: '28px', color: '#5C5537', opacity: 0.6, marginLeft: '12px' }}>
                    {String(rating)}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', fontSize: '30px', color: '#5C5537', opacity: 0.55 }}>
                  {`at ${formatTimestamp(timestamp)}`}
                </div>
              )}
            </div>

            {/* Review / annotation text */}
            {displayText ? (
              <div
                style={{
                  display: 'flex',
                  marginTop: '52px',
                  padding: '44px 52px',
                  backgroundColor: 'rgba(92,85,55,0.05)',
                  borderRadius: '16px',
                  borderLeft: '4px solid rgba(255,186,0,0.55)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: '30px',
                    color: '#5C5537',
                    lineHeight: 1.7,
                    opacity: 0.88,
                  }}
                >
                  {`"${displayText}"`}
                </div>
              </div>
            ) : null}

          </div>{/* end centered content */}

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              height: '1px',
              backgroundColor: 'rgba(92,85,55,0.12)',
              marginBottom: '40px',
            }}
          />

          {/* Footer: user + branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={avatarDataUrl}
                style={{ width: '60px', height: '60px', borderRadius: '30px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', fontSize: '28px', color: '#5C5537', opacity: 0.65 }}>
                {`@${username}`}
              </div>
            </div>

            {/* Logo + URL */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <img
                src={logoDataUrl}
                style={{ height: '52px', width: '210px', objectFit: 'contain', objectPosition: 'right center', opacity: 0.7 }}
              />
              <div style={{ display: 'flex', fontSize: '30px', color: '#5C5537', opacity: 0.45 }}>
                trackboxd.com
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
        fonts: [
          { name: 'Lora', data: fontRegular, weight: 400, style: 'normal' },
          { name: 'Lora', data: fontBold, weight: 700, style: 'normal' },
        ],
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      }
    )
  } catch (err) {
    console.error('[share/story] Error:', err)
    return new Response('Failed to generate image', { status: 500 })
  }
}
