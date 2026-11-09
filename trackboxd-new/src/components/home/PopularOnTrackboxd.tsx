"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
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
        subtitle="Trending now: recent likes, reviews & annotations"
      />

      {/* Phones: a ranked chart reads better than tiny tiles */}
      <ol className="md:hidden flex flex-col gap-1">
        {data.map((item, i) => {
          const href = item.type === "album" ? `/albums/${item.id}` : `/songs/${item.id}`;
          const reviews = item.review_count || 0;
          return (
            <li key={item.id}>
              <Link href={href} className="flex items-center gap-3.5 min-h-[72px] active:opacity-80">
                <span className="w-6 text-center text-[22px] font-bold text-[#5C5537] shrink-0">{i + 1}</span>
                <img
                  src={item.cover_url || "/default-album.jpg"}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover bg-[#5C5537]/10 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "/default-album.jpg";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-[#5C5537] truncate">{item.name}</p>
                  <p className="text-[13px] text-[#6B6547] truncate">{item.artist}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[#6B6547]">
                    <span className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${likes[item.id] ? "fill-[#5C5537] text-[#5C5537]" : ""}`} />
                      {item.like_count || 0}
                    </span>
                    {item.avg_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {Number(item.avg_rating).toFixed(1)}
                      </span>
                    )}
                    <span>
                      {reviews} {reviews === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="hidden md:grid md:grid-cols-5 gap-4">
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
