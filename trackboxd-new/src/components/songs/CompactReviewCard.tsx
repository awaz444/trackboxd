"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star, X } from "lucide-react";
import { Review } from "@/app/tracks/types";
import useUser from "@/hooks/useUser";

interface CompactReviewCardProps {
  review: Review;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (secondsAgo < 60) return secondsAgo === 1 ? "1 second ago" : `${secondsAgo} seconds ago`;
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return minutesAgo === 1 ? "1 minute ago" : `${minutesAgo} minutes ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
};

const CompactReviewCard: React.FC<CompactReviewCardProps> = ({ review }) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const trackName = review.track_details?.name || review.item?.name || "Unknown Track";
  const artistNames = review.track_details?.artists?.map(a => a.name).join(", ") || review.item?.artist || "Unknown Artist";
  const albumName = review.track_details?.album?.name || review.item?.album || "";
  const coverUrl = review.track_details?.album?.images?.[0]?.url || review.item?.cover_url || "";
  const userImage = review.users.image_url || "/default-avatar.jpg";
  const timeAgo = formatTimeAgo(review.created_at);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) { setInitialLoad(false); return; }
      try {
        const res = await fetch(`/api/likes/review?userId=${user.id}&reviewId=${review.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setIsLiked(!!data.isLiked);
      } catch {
        // noop
      } finally {
        setInitialLoad(false);
      }
    };
    checkLikeStatus();
  }, [user, review.id]);

  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  const handleLikeClick = async () => {
    if (!user || isLoading || initialLoad) return;
    setIsLoading(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount(next ? likeCount + 1 : Math.max(0, likeCount - 1));
    try {
      const res = await fetch("/api/likes/review", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, reviewId: review.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(!next);
      setLikeCount(review.like_count || 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={userImage}
                alt={review.users.name}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = "/default-avatar.jpg"; }}
              />
              <div className="font-medium text-[#5C5537]" onClick={(e) => e.stopPropagation()}>
                <Link href={`/profile/${encodeURIComponent(review.users.name)}`} className="hover:underline">
                  {review.users.name}
                </Link>
              </div>
              <div className="flex items-center text-[#FFBA00] text-sm">
                <Star className="h-4 w-4 mr-0.5 fill-current" />
                <span>{review.rating}</span>
              </div>
            </div>

            <div className="mb-2">
              <h3 className="font-semibold text-[#5C5537] text-sm">{trackName}</h3>
              <p className="text-[#5C5537]/70 text-xs">{artistNames}</p>
            </div>

            {review.text && (
              <p className="text-[#5C5537] text-sm line-clamp-2 mb-2">{review.text}</p>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs text-[#5C5537]/70">{timeAgo}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleLikeClick(); }}
                  disabled={isLoading || initialLoad || !user}
                  className={`flex items-center gap-1 text-xs focus:outline-none ${
                    isLoading || initialLoad || !user
                      ? "cursor-not-allowed text-[#5C5537]/40"
                      : "cursor-pointer text-[#5C5537]/70 hover:text-[#5C5537]"
                  }`}
                >
                  {initialLoad ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#5C5537]" />
                    </div>
                  ) : (
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537] text-[#5C5537]" : ""}`} />
                  )}
                  <span className={isLiked ? "font-medium text-[#5C5537]" : ""}>{likeCount}</span>
                </button>
                <Link
                  href={`/songs/${review.item_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[#5C5537]/70 hover:text-[#5C5537]"
                >
                  View track
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#FFFBEb] rounded-xl w-full max-w-lg border border-[#5C5537]/20 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#5C5537]/10 flex-shrink-0">
              <span className="text-sm font-semibold text-[#5C5537]">Review</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5C5537]/60 hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              <div className="flex gap-4 items-start">
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt={trackName}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#5C5537] text-lg leading-tight">{trackName}</h3>
                  <p className="text-[#5C5537]/70 text-sm mt-0.5">{artistNames}</p>
                  {albumName && <p className="text-[#5C5537]/50 text-xs italic mt-0.5">{albumName}</p>}
                  <div className="flex items-center gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= review.rating ? "text-[#FFBA00] fill-[#FFBA00]" : "text-[#5C5537]/20"}`}
                      />
                    ))}
                    <span className="text-[#5C5537] text-sm ml-1.5">{review.rating}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#5C5537]/10 pt-4 text-[#5C5537] text-sm leading-relaxed whitespace-pre-wrap">
                {review.text || <span className="italic text-[#5C5537]/50">No written review.</span>}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-[#5C5537]/10 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={userImage}
                  alt={review.users.name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.src = "/default-avatar.jpg"; }}
                />
                <Link
                  href={`/profile/${encodeURIComponent(review.users.name)}`}
                  className="text-sm text-[#5C5537]/70 hover:text-[#5C5537] truncate"
                >
                  @{review.users.name}
                </Link>
                <span className="text-[#5C5537]/30 text-xs">·</span>
                <span className="text-xs text-[#5C5537]/50 flex-shrink-0">{timeAgo}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <button
                  onClick={handleLikeClick}
                  disabled={isLoading || !user}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isLiked ? "text-[#5C5537]" : "text-[#5C5537]/50 hover:text-[#5C5537]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
                  <span className={isLiked ? "font-medium" : ""}>{likeCount}</span>
                </button>
                <Link
                  href={`/songs/${review.item_id}`}
                  className="text-xs text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
                >
                  View track
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompactReviewCard;
