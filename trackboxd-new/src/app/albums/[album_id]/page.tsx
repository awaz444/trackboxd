import type { Metadata } from 'next';
import { getAlbumDetails } from '@/lib/spotify';
import { createPublicClient } from '@/lib/supabase/public';
import AlbumDetailClient from './AlbumDetailClient';
import { AlbumJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/site';

// Public album pages are the same for every visitor — serve from the ISR cache
// so crawlers get a fast response instead of a cold render each time.
export const revalidate = 3600;

// Prerender the albums that already have activity; the rest render on demand
// and are cached for `revalidate` seconds.
export async function generateStaticParams() {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('spotify_items')
      .select('id')
      .eq('type', 'album')
      .order('review_count', { ascending: false })
      .limit(50);
    return (data || []).map((a) => ({ album_id: a.id as string }));
  } catch {
    return [];
  }
}


interface Props {
  params: { album_id: string };
}

async function getAlbum(album_id: string) {
  try {
    const albumDetails = await getAlbumDetails(album_id, { revalidate });
  const supabase = createPublicClient();

    const { data: stats } = await supabase
      .from('spotify_items')
      .select('*')
      .eq('id', album_id)
      .eq('type', 'album')
      .single();

    return {
      ...albumDetails,
      stats: stats || {
        like_count: 0,
        review_count: 0,
        avg_rating: 0
      }
    };
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { album_id } = await params;
  const album = await getAlbum(album_id);
  if (!album) return { title: 'Album not found' };

  const artistNames = album.artists.map((a: any) => a.name).join(', ');

  return {
    title: `${album.name} by ${artistNames}`,
    description: `${album.total_tracks} tracks, ${album.stats?.review_count || 0} reviews. Rate and annotate every song on ${album.name} by ${artistNames}.`,
    openGraph: {
      title: `${album.name} — ${artistNames}`,
      description: `${album.stats?.review_count || 0} Trackboxd reviews for this album.`,
      images: [
        {
          url: album.images?.[0]?.url || '/default-album.png',
          width: 1200,
          height: 630,
          alt: `${album.name} by ${artistNames} on Trackboxd`,
        },
      ],
    },
    alternates: {
      canonical: `${SITE_URL}/albums/${album_id}`,
    },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { album_id } = await params;
  const album = await getAlbum(album_id);

  return (
    <>
      {album && <AlbumJsonLd album={album} />}
      <AlbumDetailClient params={{ album_id }} initialAlbum={album} />
    </>
  );
}
