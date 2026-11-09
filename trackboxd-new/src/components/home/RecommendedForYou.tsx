"use client";

import MediaCard from "@/components/MediaCard";
import TileRail from "@/components/TileRail";
import HomeSectionHeader from "./HomeSectionHeader";

interface RecommendedItem {
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
  data: RecommendedItem[];
  fallbackData?: RecommendedItem[]; // Popular items shown when no interest profile yet
  likes?: Record<string, boolean>;
}

export default function RecommendedForYou({ data, fallbackData = [], likes = {} }: Props) {
  const items = data.length > 0 ? data : fallbackData;
  if (items.length === 0) return null;

  const isPersonalized = data.length > 0;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="Recommended for You"
        subtitle={
          isPersonalized
            ? "Based on your listening activity"
            : "Discover popular music"
        }
      />
      <TileRail cols="sm:grid-cols-3 md:grid-cols-5" itemWidth="w-[38%]">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            coverUrl={item.cover_url || "/default-album.jpg"}
            name={item.name}
            artist={item.artist}
            avgRating={item.avg_rating}
            itemType={item.type === "album" ? "album" : "track"}
            itemId={item.id}
            isLiked={likes[item.id] || false}
          />
        ))}
      </TileRail>
    </section>
  );
}
