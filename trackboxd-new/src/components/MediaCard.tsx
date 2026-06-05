"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Star, Clock, Share2, Check } from "lucide-react";
import useUser from "@/hooks/useUser";

export interface MediaCardProps {
  coverUrl: string;
  name: string;
  artist?: string;
  avgRating?: number;
  likeCount?: number;
  reviewCount?: number;
  annotationCount?: number;
  itemType: "track" | "album";
  itemId: string;
  isLiked?: boolean;
  showPopularStats?: boolean;
  variant?: "default" | "poster";
  // poster variant — review attribution
  user?: { name: string; image_url?: string };
  reviewRating?: number;
  hasReviewText?: boolean;
  reviewId?: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <div key={star} className="relative w-3.5 h-3.5 text-sm leading-none">
        <span className="absolute text-[#5C5537]/30">★</span>
        <span
          className="absolute text-[#FFBA00] overflow-hidden"
          style={{ width: `${Math.max(0, Math.min(1, rating - star + 1)) * 100}%` }}
        >
          ★
        </span>
      </div>
    ))}
  </div>
);

const MediaCard: React.FC<MediaCardProps> = ({
  coverUrl,
  name,
  artist,
  avgRating,
  likeCount: initialLikeCount = 0,
  reviewCount,
  annotationCount,
  itemType,
  itemId,
  isLiked: initialIsLiked = false,
  showPopularStats = false,
  variant = "default",
  user,
  reviewRating,
  hasReviewText,
  reviewId,
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user: currentUser } = useUser();

  const cardHref = itemType === "track" ? `/songs/${itemId}` : `/albums/${itemId}`;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || isLiking) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => prev + (newIsLiked ? 1 : -1));
    setIsLiking(true);

    try {
      const endpoint = itemType === "track" ? "/api/likes/track" : "/api/likes/album";
      const itemKey = itemType === "track" ? "trackId" : "albumId";
      await fetch(endpoint, {
        method: newIsLiked ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, [itemKey]: itemId }),
      });
    } catch {
      setIsLiked(!newIsLiked);
      setLikeCount((prev) => prev + (isLiked ? 1 : -1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${cardHref}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  if (variant === "poster") {
    const posterHref = reviewId ? `/reviews/${reviewId}` : cardHref;
    return (
      <Link href={posterHref} className="group block h-full">
        <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
          {/* Cover — tall, fills ~80% */}
          <div className="relative" style={{ paddingBottom: "140%" }}>
            <img
              src={coverUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/default-album.jpg";
              }}
            />
            {/* Gradient overlay with user attribution */}
            {user && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex items-center gap-2">
                {user.image_url ? (
                  <img
                    src={user.image_url}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#5C5537]/60 flex items-center justify-center border border-white/40 flex-shrink-0">
                    <span className="text-white text-xs font-bold">{user.name[0]}</span>
                  </div>
                )}
                <span className="text-white text-xs font-medium truncate">{user.name}</span>
              </div>
            )}
          </div>
          {/* Bottom info: name, artist, then stars on next line on mobile */}
          <div className="p-3 flex flex-col gap-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#5C5537] truncate">{name}</p>
              {artist && (
                <p className="text-xs text-[#5C5537]/60 truncate">{artist}</p>
              )}
            </div>
            {((reviewRating !== undefined && reviewRating > 0) || hasReviewText) && (
              <div className="flex items-center gap-1.5">
                {reviewRating !== undefined && reviewRating > 0 && (
                  <StarRating rating={reviewRating} />
                )}
                {hasReviewText && (
                  <Star className="w-3 h-3 text-[#5C5537]/60" />
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={cardHref} className="group block">
      <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
        {/* Cover with hoverable actions */}
        <div className="relative aspect-square">
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/default-album.jpg";
            }}
          />
          {/* Hover actions: like + share */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleShare}
              aria-label="Share"
              className="p-1.5 rounded-full bg-[#FFFBEb]/85 hover:bg-[#FFFBEb] shadow-sm"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#5C5537]" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-[#5C5537]/70" />
              )}
            </button>
            {currentUser && (
              <button
                onClick={handleLike}
                disabled={isLiking}
                aria-label={isLiked ? "Unlike" : "Like"}
                className="p-1.5 rounded-full bg-[#FFFBEb]/85 hover:bg-[#FFFBEb] shadow-sm"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isLiked ? "text-[#5C5537] fill-[#5C5537]" : "text-[#5C5537]/60"
                  }`}
                />
              </button>
            )}
          </div>
        </div>
        {/* Info */}
        <div className="p-3 flex flex-col gap-1">
          <p className="text-sm font-semibold text-[#5C5537] truncate leading-snug">
            {name}
          </p>
          {artist && (
            <p className="text-xs text-[#5C5537]/70 truncate">{artist}</p>
          )}
          {avgRating !== undefined && avgRating > 0 && (
            <StarRating rating={avgRating} />
          )}
          {showPopularStats && (
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-[#5C5537]/60">
                <Heart className="w-3 h-3" />
                {likeCount}
              </span>
              {reviewCount !== undefined && (
                <span className="flex items-center gap-1 text-xs text-[#5C5537]/60">
                  <Star className="w-3 h-3" />
                  {reviewCount}
                </span>
              )}
              {annotationCount !== undefined && itemType === "track" && (
                <span className="flex items-center gap-1 text-xs text-[#5C5537]/60">
                  <Clock className="w-3 h-3" />
                  {annotationCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MediaCard;
