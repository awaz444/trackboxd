"use client";

import MediaCard from "@/components/MediaCard";
import HomeSectionHeader from "./HomeSectionHeader";

interface NewReview {
  review_id: string;
  rating: number;
  has_text: boolean;
  created_at: string;
  item_id: string;
  item_type: string;
  name: string;
  artist: string;
  cover_url: string;
  user: { id: string; name: string; image_url?: string };
}

interface Props {
  data: NewReview[];
  likes?: Record<string, boolean>;
}

export default function NewOnTrackboxd({ data, likes = {} }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader title="New on Trackboxd" />
      <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:gap-4 sm:grid-cols-4">
        {data.map((review) => (
          <div key={review.review_id} className="w-[42%] shrink-0 snap-start sm:w-auto">
          <MediaCard
            variant="poster"
            coverUrl={review.cover_url || "/default-album.jpg"}
            name={review.name}
            artist={review.artist}
            itemType={review.item_type === "album" ? "album" : "track"}
            itemId={review.item_id}
            reviewId={review.review_id}
            reviewRating={review.rating}
            hasReviewText={review.has_text}
            user={review.user}
            isLiked={likes[review.item_id] || false}
          />
          </div>
        ))}
      </div>
    </section>
  );
}
