"use client";

import MediaCard from "@/components/MediaCard";
import HomeSectionHeader from "./HomeSectionHeader";

interface PopularItem {
  id: string;
  type: string;
  name: string;
  artist: string;
  cover_url: string;
  like_count: number;
  review_count: number;
  annotation_count: number;
  avg_rating: number;
}

interface Props {
  data: PopularItem[];
  likes?: Record<string, boolean>;
}

export default function PopularOnTrackboxd({ data, likes = {} }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="Popular on Trackboxd"
        subtitle="Ranked by likes, reviews & annotations"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {data.map((item) => (
          <MediaCard
            key={item.id}
            coverUrl={item.cover_url || "/default-album.jpg"}
            name={item.name}
            artist={item.artist}
            avgRating={item.avg_rating}
            likeCount={item.like_count}
            reviewCount={item.review_count}
            annotationCount={item.annotation_count}
            itemType={item.type === "album" ? "album" : "track"}
            itemId={item.id}
            isLiked={likes[item.id] || false}
            showPopularStats
          />
        ))}
      </div>
    </section>
  );
}
