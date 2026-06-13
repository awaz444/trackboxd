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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: albumName ? '8px' : '0px' }}>
              <div style={{ display: 'flex', fontSize: '32px', color: '#5C5537', opacity: 0.65, textAlign: 'center' }}>
                {displayArtist}
              </div>
            </div>

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
          </div>

          <div
            style={{
              display: 'flex',
              height: '1px',
              backgroundColor: 'rgba(92,85,55,0.12)',
              marginBottom: '40px',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={avatarDataUrl}
                style={{ width: '60px', height: '60px', borderRadius: '30px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', fontSize: '28px', color: '#5C5537', opacity: 0.65 }}>
                {`@${username}`}
              </div>
            </div>

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
