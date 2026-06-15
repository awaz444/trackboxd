import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Star, ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'
import { getServerUser } from '@/lib/supabase/get-server-user'
import LikeButton from '@/components/share/LikeButton'
import ShareButton from '@/components/share/ShareButton'
import { VipBadge } from '@/components/VipBadge'

interface PageProps {
  params: { id: string }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (secondsAgo < 60) return `${secondsAgo}s ago`
  const minutesAgo = Math.floor(secondsAgo / 60)
  if (minutesAgo < 60) return `${minutesAgo}m ago`
  const hoursAgo = Math.floor(minutesAgo / 60)
  if (hoursAgo < 24) return `${hoursAgo}h ago`
  const daysAgo = Math.floor(hoursAgo / 24)
  if (daysAgo < 30) return `${daysAgo}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

async function getReview(id: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, text, created_at, is_public, item_id, like_count,
      users:user_id (id, name, image_url),
      spotify_items!reviews_item_id_fkey (id, name, artist, album, cover_url, type)
    `)
    .eq('id', id)
    .eq('is_public', true)
    .single()
  if (error || !data) return null
  return data as any
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const review = await getReview(params.id)
  if (!review) return { title: 'Review not found' }

  const trackName = review.spotify_items?.name ?? 'Unknown Track'
  const username = review.users?.name ?? 'Someone'
  const rating = review.rating
  const title = `${username}'s ${rating}/5 review of ${trackName}`
  const description = review.text
    ? review.text.slice(0, 160)
    : `${username} rated ${trackName} ${rating} out of 5 on Trackboxd.`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trackboxd.com'
  const pageUrl = `${baseUrl}/reviews/${params.id}`
  const ogImage = `${baseUrl}/api/share/og?type=review&id=${params.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ReviewPage({ params }: PageProps) {
  const [review, currentUser] = await Promise.all([
    getReview(params.id),
    getServerUser(),
  ])

  if (!review) notFound()

  const trackName = review.spotify_items?.name ?? 'Unknown Track'
  const artistName = review.spotify_items?.artist ?? 'Unknown Artist'
  const albumName = review.spotify_items?.album ?? ''
  const coverUrl: string = review.spotify_items?.cover_url ?? ''
  const username: string = review.users?.name ?? 'Anonymous'
  const avatarUrl: string = review.users?.image_url ?? '/default-avatar.jpg'
  const timeAgo = formatTimeAgo(review.created_at)
  const rating: number = review.rating

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/songs/${review.item_id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#5C5537]/60 hover:text-[#5C5537] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {trackName}
        </Link>

        {/* Featured review card */}
        <div className="rounded-2xl border border-[#5C5537]/20 bg-[#FFFBEb] p-6">
          {/* Track header */}
          <div className="flex gap-4 items-start mb-5">
            {coverUrl && (
              <img
                src={coverUrl}
                alt={trackName}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[#5C5537]/45 text-xs uppercase tracking-widest mb-1">Review</p>
              <h1 className="text-[#5C5537] font-bold text-xl leading-tight">{trackName}</h1>
              <p className="text-[#5C5537]/65 text-sm mt-0.5">{artistName}</p>
              {albumName && <p className="text-[#5C5537]/45 text-xs italic mt-0.5">{albumName}</p>}
              {/* Half-star rating */}
              <div className="flex items-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map(i => {
                  const fill = Math.max(0, Math.min(1, rating - (i - 1)))
                  return (
                    <div key={i} className="relative w-4 h-4">
                      <Star className="w-4 h-4 text-[#5C5537]/15" />
                      {fill > 0 && (
                        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                          <Star className="w-4 h-4 text-[#FFBA00] fill-[#FFBA00]" />
                        </div>
                      )}
                    </div>
                  )
                })}
                <span className="text-[#5C5537]/70 text-sm ml-1.5">{rating}</span>
              </div>
            </div>
          </div>

          {/* Review text */}
          {review.text && (
            <p className="text-[#5C5537] text-sm leading-relaxed border-t border-[#5C5537]/10 pt-4 mb-5">
              {review.text}
            </p>
          )}

          {/* Footer row */}
          <div className={`flex items-center justify-between gap-4 ${review.text ? '' : 'border-t border-[#5C5537]/10 pt-4'}`}>
            <Link
              href={`/profile/${encodeURIComponent(username)}`}
              className="flex items-center gap-2 group min-w-0"
            >
              <img
                src={avatarUrl}
                alt={username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={undefined}
              />
                <div className="min-w-0">
                  <p className="text-[#5C5537] text-sm font-medium group-hover:underline truncate flex items-center gap-1">
                    @{username}
                    <VipBadge username={username} />
                  </p>
                  <p className="text-[#5C5537]/50 text-xs">{timeAgo}</p>
                </div>
              </Link>

              <div className="flex items-center gap-1 flex-shrink-0">
                <LikeButton
                  type="review"
                  id={review.id}
                  initialLikeCount={review.like_count}
                  userId={currentUser?.id ?? null}
                  variant="light"
                />
                <ShareButton type="review" id={review.id} variant="light" />
              </div>
            </div>
        </div>

        {/* Track + Author info cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href={`/songs/${review.item_id}`}
            className="bg-[#FFFBEb] border border-[#5C5537]/15 rounded-xl p-4 flex gap-3 items-center hover:shadow-md transition-shadow group"
          >
            {coverUrl && (
              <img src={coverUrl} alt={trackName} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[#5C5537]/45 text-xs uppercase tracking-wide mb-1">Track</p>
              <p className="font-semibold text-[#5C5537] text-sm truncate">{trackName}</p>
              <p className="text-[#5C5537]/60 text-xs truncate">{artistName}</p>
              <p className="text-[#5C5537]/40 text-xs mt-1 group-hover:text-[#5C5537]/60 transition-colors">
                View on Trackboxd →
              </p>
            </div>
          </Link>

          <Link
            href={`/profile/${encodeURIComponent(username)}`}
            className="bg-[#FFFBEb] border border-[#5C5537]/15 rounded-xl p-4 flex gap-3 items-center hover:shadow-md transition-shadow group"
          >
            <img
              src={avatarUrl}
              alt={username}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[#5C5537]/45 text-xs uppercase tracking-wide mb-1">Reviewer</p>
              <p className="font-semibold text-[#5C5537] text-sm truncate flex items-center gap-1">
                @{username}
                <VipBadge username={username} />
              </p>
              <p className="text-[#5C5537]/40 text-xs mt-1 group-hover:text-[#5C5537]/60 transition-colors">
                View profile →
              </p>
            </div>
          </Link>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  )
}
