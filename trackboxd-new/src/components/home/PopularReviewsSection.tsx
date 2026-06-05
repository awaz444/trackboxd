"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

interface PopularReview {
  id: string;
  rating: number;
  text: string;
  like_count: number;
  created_at: string;
  item_id: string;
  item_type: string;
  item_name: string;
  artist: string;
  cover_url: string;
  user: { id: string; name: string; image_url?: string; username?: string };
}

interface Props {
  data: PopularReview[];
}

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className={`text-sm ${
          s <= Math.floor(rating) ? "text-[#FFBA00]" : "text-[#5C5537]/20"
        }`}
      >
        ★
      </span>
    ))}
  </div>
);

export default function PopularReviewsSection({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="Popular Reviews This Week"
        subtitle="Most liked reviews in the past week"
        viewMoreHref="/tracks"
      />
      <div className="space-y-3">
        {data.map((review) => (
          <Link
            key={review.id}
            href={`/reviews/${review.id}`}
            className="block bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Cover */}
              <img
                src={review.cover_url || "/default-album.jpg"}
                alt={review.item_name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = "/default-album.jpg";
                }}
              />
              <div className="min-w-0 flex-1">
                {/* Item info */}
                <p className="text-xs text-[#5C5537]/60 truncate">
                  {review.artist} — {review.item_name}
                </p>
                {/* User + stars */}
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <img
                    src={review.user.image_url || "/default-avatar.jpg"}
                    alt={review.user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-[#5C5537]">
                    {review.user.name}
                  </span>
                  <StarRow rating={review.rating} />
                </div>
                {/* Review text preview */}
                <p className="text-sm text-[#5C5537]/80 line-clamp-2">
                  {review.text}
                </p>
              </div>
              {/* Like count */}
              <div className="flex items-center gap-1 text-[#5C5537]/60 text-xs flex-shrink-0 self-start">
                <Heart className="w-3.5 h-3.5" />
                <span>{review.like_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
