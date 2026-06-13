import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import {
  loadShareCardData,
  truncate,
  formatTimestamp,
  type ShareCardType,
} from '@/lib/share-card-data'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as ShareCardType | null
  const id = searchParams.get('id')

  if (!type || !id || !['review', 'annotation'].includes(type)) {
    return new Response('Missing or invalid params', { status: 400 })
  }

  try {
    const data = await loadShareCardData(type, id)
    if (!data) return new Response('Not found', { status: 404 })

    const {
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
    } = data

    const displayText = truncate(contentText, 120)
    const displayTrack = truncate(trackName, 36)
    const displayArtist = truncate(artistName, 40)

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFBEb',
            fontFamily: 'Lora',
            padding: '48px 56px 40px',
          }}
        >
          <div style={{ flex: 1, display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
            {coverDataUrl ? (
              <img
                src={coverDataUrl}
                style={{ width: '280px', height: '280px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: '280px',
                  height: '280px',
                  backgroundColor: '#E8E4D9',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', fontSize: '48px', color: '#5C5537', opacity: 0.2 }}>?</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: '42px',
                  fontWeight: 700,
                  color: '#1F2C24',
                  lineHeight: 1.15,
                  marginBottom: '10px',
                }}
              >
                {displayTrack}
              </div>

              <div style={{ display: 'flex', fontSize: '24px', color: '#5C5537', opacity: 0.65, marginBottom: albumName ? '4px' : '0px' }}>
                {displayArtist}
              </div>

              {albumName ? (
                <div style={{ display: 'flex', fontSize: '20px', color: '#5C5537', opacity: 0.42, fontStyle: 'italic' }}>
                  {truncate(albumName, 44)}
                </div>
              ) : null}

              <div style={{ display: 'flex', marginTop: '20px' }}>
                {type === 'review' ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {Array.from({ length: 5 }, (_, i) => {
                      const fill = Math.max(0, Math.min(1, rating - i))
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            width: '56px',
                            height: '10px',
                            borderRadius: '5px',
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
                    <div style={{ display: 'flex', fontSize: '22px', color: '#5C5537', opacity: 0.6, marginLeft: '8px' }}>
                      {String(rating)}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', fontSize: '22px', color: '#5C5537', opacity: 0.55 }}>
                    {`at ${formatTimestamp(timestamp)}`}
                  </div>
                )}
              </div>

              {displayText ? (
                <div
                  style={{
                    display: 'flex',
                    marginTop: '24px',
                    padding: '20px 24px',
                    backgroundColor: 'rgba(92,85,55,0.05)',
                    borderRadius: '12px',
                    borderLeft: '4px solid rgba(255,186,0,0.55)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: '20px',
                      color: '#5C5537',
                      lineHeight: 1.6,
                      opacity: 0.88,
                    }}
                  >
                    {`"${displayText}"`}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              height: '1px',
              backgroundColor: 'rgba(92,85,55,0.12)',
              marginTop: '32px',
              marginBottom: '24px',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={avatarDataUrl}
                style={{ width: '44px', height: '44px', borderRadius: '22px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', fontSize: '20px', color: '#5C5537', opacity: 0.65 }}>
                {`@${username}`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={logoDataUrl}
                style={{ height: '36px', width: '150px', objectFit: 'contain', objectPosition: 'right center', opacity: 0.7 }}
              />
              <div style={{ display: 'flex', fontSize: '18px', color: '#5C5537', opacity: 0.45 }}>
                trackboxd.com
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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
    console.error('[share/og] Error:', err)
    return new Response('Failed to generate image', { status: 500 })
  }
}
