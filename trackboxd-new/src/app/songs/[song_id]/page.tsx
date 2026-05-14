import type { Metadata } from 'next';
import { getTrackDetails } from '@/lib/spotify';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import SongDetailClient from './SongDetailClient';
import { SongJsonLd } from '@/components/seo/JsonLd';

interface Props {
  params: { song_id: string };
}

async function getTrack(song_id: string) {
  try {
    const trackDetails = await getTrackDetails(song_id);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: stats } = await supabase
      .from('spotify_items')
      .select('*')
      .eq('id', song_id)
      .eq('type', 'track')
      .single();

    return {
      ...trackDetails,
      stats: stats || {
        like_count: 0,
        review_count: 0,
        annotation_count: 0,
        avg_rating: 0
      }
    };
  } catch (error) {
    console.error('Error fetching track:', error);
    return null;
  }
}

async function getReviews(song_id: string) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        text,
        created_at,
        like_count,
        is_public,
        users:user_id (
          id,
          name,
          image_url
        )
      `)
      .eq('item_id', song_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);
    return reviews || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

async function getAnnotations(song_id: string) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: annotations } = await supabase
      .from('annotations')
      .select(`
        id,
        timestamp,
        text,
        created_at,
        like_count,
        is_public,
        users:user_id (
          id,
          name,
          image_url
        )
      `)
      .eq('track_id', song_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);
    return annotations || [];
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { song_id } = await params;
  const track = await getTrack(song_id);
  if (!track) return { title: 'Track not found' };

  const artistNames = track.artists.map((a: any) => a.name).join(', ');

  return {
    title: `${track.name} by ${artistNames}`,
    description: `Ratings, reviews, and annotations for "${track.name}" by ${artistNames}. ${track.stats?.review_count || 0} reviews on Trackboxd.`,
    openGraph: {
      title: `${track.name} — ${artistNames}`,
      description: `${track.stats?.review_count || 0} Trackboxd reviews for this track.`,
      images: [
        {
          url: track.album?.images?.[0]?.url || '/default-album.png',
          width: 1200,
          height: 630,
          alt: `${track.name} by ${artistNames} on Trackboxd`,
        },
      ],
    },
    alternates: {
      canonical: `https://trackboxd.com/songs/${song_id}`,
    },
  };
}

export default async function SongPage({ params }: Props) {
  const { song_id } = await params;
  const [track, reviews, annotations] = await Promise.all([
    getTrack(song_id),
    getReviews(song_id),
    getAnnotations(song_id),
  ]);

  return (
    <>
      {track && <SongJsonLd song={{ ...track, topReviews: reviews as any }} />}
      <SongDetailClient
        params={{ song_id }}
        initialTrack={track}
        initialReviews={reviews as any}
        initialAnnotations={annotations as any}
      />
    </>
  );
}
