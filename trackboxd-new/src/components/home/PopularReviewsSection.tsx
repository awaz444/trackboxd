"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import useUser from "@/hooks/useUser";
import HomeSectionHeader from "./HomeSectionHeader";
import { VipBadge } from "@/components/VipBadge";

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
  likes?: Record<string, boolean>;
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

const ReviewRow = ({
  review,
  initialIsLiked,
}: {
  review: PopularReview;
  initialIsLiked: boolean;
}) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(review.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setIsLiked(initialIsLiked), [initialIsLiked]);
  useEffect(() => setLikeCount(review.like_count || 0), [review.like_count]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || isLoading) return;
    setIsLoading(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      const res = await fetch("/api/likes/review", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, reviewId: review.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(!next);
      setLikeCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
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
            <span className="text-xs font-medium text-[#5C5537] inline-flex items-center gap-1">
              {review.user.name}
              <VipBadge username={review.user.name} />
            </span>
            <StarRow rating={review.rating} />
          </div>
          {/* Review text preview */}
          <p className="text-sm text-[#5C5537]/80 line-clamp-2">
            {review.text}
          </p>
        </div>
        {/* Like */}
        <button
          onClick={handleToggleLike}
          disabled={isLoading || !user}
          className={`flex items-center gap-1 text-xs flex-shrink-0 self-start focus:outline-none ${
            isLoading || !user
              ? "cursor-not-allowed text-[#5C5537]/40"
              : "cursor-pointer text-[#5C5537]/60 hover:text-[#5C5537]"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-[#5C5537] text-[#5C5537]" : ""}`} />
          <span className={isLiked ? "text-[#5C5537] font-medium" : ""}>{likeCount}</span>
        </button>
      </div>
    </Link>
  );
};

export default function PopularReviewsSection({ data, likes = {} }: Props) {
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
          <ReviewRow key={review.id} review={review} initialIsLiked={likes[review.id] || false} />
        ))}
      </div>
    </section>
  );
}
