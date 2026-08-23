import React from 'react';
import { SITE_URL } from '@/lib/site';

// Types for the components
interface Song {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album?: {
    name: string;
    images?: Array<{ url: string }>;
  };
  external_urls?: {
    spotify?: string;
  };
  stats?: {
    avg_rating: number;
    review_count: number;
  };
  topReviews?: Array<{
    id: string;
    text: string;
    rating: number;
    users: {
      name: string;
    };
  }>;
}

interface User {
  name: string;
  image_url?: string;
  stats?: {
    reviews: number;
    annotations: number;
  };
}

interface Album {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  total_tracks: number;
  images?: Array<{ url: string }>;
  tracks?: {
    items: Array<{
      id: string;
      name: string;
    }>;
  };
  stats?: {
    avg_rating: number;
    review_count: number;
  };
}

// 3.1 Song Page JSON-LD
export function SongJsonLd({ song }: { song: Song }) {
  const artistNames = song.artists.map((a) => a.name).join(', ');
  
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.name,
    byArtist: {
      '@type': 'MusicGroup',
      name: artistNames,
    },
    inAlbum: song.album
      ? {
          '@type': 'MusicAlbum',
          name: song.album.name,
          image: song.album.images?.[0]?.url,
        }
      : undefined,
    url: `${SITE_URL}/songs/${song.id}`,
    sameAs: [
      song.external_urls?.spotify ? song.external_urls.spotify : null,
    ].filter(Boolean),
    aggregateRating: song.stats && song.stats.review_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: song.stats.avg_rating,
          reviewCount: song.stats.review_count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    // Nest reviews directly
    review: song.topReviews?.map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.users.name,
        url: `${SITE_URL}/profile/${r.users.name}`,
      },
      reviewBody: r.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// 3.2 Profile Page JSON-LD
export function ProfileJsonLd({ user, username }: { user: User, username: string }) {
  const interactionStatistic = [
    user.stats?.reviews
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ReviewAction',
          userInteractionCount: user.stats.reviews,
        }
      : null,
    user.stats?.annotations
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: user.stats.annotations,
        }
      : null,
  ].filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${user.name} (@${username}) on Trackboxd`,
    url: `${SITE_URL}/profile/${username}`,
    mainEntity: {
      '@type': 'Person',
      name: user.name,
      identifier: username,
      image: user.image_url,
      description: `Music listener with ${user.stats?.reviews || 0} reviews and ${user.stats?.annotations || 0} annotations on Trackboxd.`,
      ...(interactionStatistic.length > 0 && { interactionStatistic }),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// 3.3 Album Page JSON-LD
export function AlbumJsonLd({ album }: { album: Album }) {
  const artistNames = album.artists.map((a) => a.name).join(', ');
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.name,
    byArtist: { '@type': 'MusicGroup', name: artistNames },
    numTracks: album.total_tracks,
    image: album.images?.[0]?.url,
    track: album.tracks?.items.map((t) => ({
      '@type': 'MusicRecording',
      name: t.name,
      url: `${SITE_URL}/songs/${t.id}`,
    })),
    aggregateRating: album.stats && album.stats.review_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: album.stats.avg_rating,
          reviewCount: album.stats.review_count,
          bestRating: 5,
        }
      : undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
