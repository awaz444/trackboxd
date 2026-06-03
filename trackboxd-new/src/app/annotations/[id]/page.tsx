import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'
import { getServerUser } from '@/lib/supabase/get-server-user'
import LikeButton from '@/components/share/LikeButton'
import ShareButton from '@/components/share/ShareButton'

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

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function getAnnotation(id: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from('annotations')
    .select(`
      id, text, timestamp, created_at, is_public, track_id, like_count,
      users:user_id (id, name, image_url),
      spotify_items!annotations_track_id_fkey (id, name, artist, album, cover_url, type)
    `)
    .eq('id', id)
    .eq('is_public', true)
    .single()
  if (error || !data) return null
  return data as any
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const annotation = await getAnnotation(params.id)
  if (!annotation) return { title: 'Annotation not found' }

  const trackName = annotation.spotify_items?.name ?? 'Unknown Track'
  const username = annotation.users?.name ?? 'Someone'
  const ts = formatTimestamp(annotation.timestamp ?? 0)
  const title = `${username}'s annotation on ${trackName} at ${ts}`
  const description = annotation.text
    ? annotation.text.slice(0, 160)
    : `${username} annotated ${trackName} at ${ts} on Trackboxd.`
  const ogImage = `/api/share/story?type=annotation&id=${params.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1080, height: 1920 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function AnnotationPage({ params }: PageProps) {
  const [annotation, currentUser] = await Promise.all([
    getAnnotation(params.id),
    getServerUser(),
  ])

  if (!annotation) notFound()

  const trackName = annotation.spotify_items?.name ?? 'Unknown Track'
  const artistName = annotation.spotify_items?.artist ?? 'Unknown Artist'
  const coverUrl: string = annotation.spotify_items?.cover_url ?? ''
  const username: string = annotation.users?.name ?? 'Anonymous'
  const avatarUrl: string = annotation.users?.image_url ?? '/default-avatar.jpg'
  const timeAgo = formatTimeAgo(annotation.created_at)
  const timestamp = formatTimestamp(annotation.timestamp ?? 0)

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/songs/${annotation.track_id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#5C5537]/60 hover:text-[#5C5537] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {trackName}
        </Link>

        {/* Featured annotation card */}
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
              <p className="text-[#5C5537]/45 text-xs uppercase tracking-widest mb-1">Annotation</p>
              <h1 className="text-[#5C5537] font-bold text-xl leading-tight">{trackName}</h1>
              <p className="text-[#5C5537]/65 text-sm mt-0.5">{artistName}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3.5 h-3.5 text-[#5C5537]/50" />
                <span className="text-[#5C5537]/60 text-sm">at {timestamp}</span>
              </div>
            </div>
          </div>

          {/* Annotation text */}
          {annotation.text && (
            <p className="text-[#5C5537] text-sm leading-relaxed border-t border-[#5C5537]/10 pt-4 mb-5">
              {annotation.text}
            </p>
          )}

          {/* Footer row */}
          <div className={`flex items-center justify-between gap-4 ${annotation.text ? '' : 'border-t border-[#5C5537]/10 pt-4'}`}>
            <Link
              href={`/profile/${encodeURIComponent(username)}`}
              className="flex items-center gap-2 group min-w-0"
            >
              <img
                src={avatarUrl}
                alt={username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[#5C5537] text-sm font-medium group-hover:underline truncate">
                  @{username}
                </p>
                <p className="text-[#5C5537]/50 text-xs">{timeAgo}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 flex-shrink-0">
              <LikeButton
                type="annotation"
                id={annotation.id}
                initialLikeCount={annotation.like_count}
                userId={currentUser?.id ?? null}
                variant="light"
              />
              <ShareButton type="annotation" id={annotation.id} variant="light" />
            </div>
          </div>
        </div>

        {/* Track + Author info cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href={`/songs/${annotation.track_id}`}
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
              <p className="text-[#5C5537]/45 text-xs uppercase tracking-wide mb-1">Author</p>
              <p className="font-semibold text-[#5C5537] text-sm truncate">@{username}</p>
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
