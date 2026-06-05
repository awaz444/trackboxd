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
}

export default function NewOnTrackboxd({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader title="New on Trackboxd" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.map((review) => (
          <MediaCard
            key={review.review_id}
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
          />
        ))}
      </div>
    </section>
  );
}
