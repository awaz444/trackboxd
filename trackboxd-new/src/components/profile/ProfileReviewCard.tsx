"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star, X, Share2, ExternalLink } from "lucide-react";
import ShareSheet from "@/components/share/ShareSheet";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileReviewCardProps {
  review: {
    id: string;
    type: "review";
    track: {
      id: string;
      title: string;
      artist: string;
      cover_url?: string;
      type?: string;
    };
    timestamp: string;
    rating?: number;
    text?: string;
    like_count?: number;
    is_public?: boolean;
  };
}

const ProfileReviewCard: React.FC<ProfileReviewCardProps> = ({ review }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user) { setInitialLoad(false); return; }
      try {
        const response = await fetch(`/api/likes/review?userId=${user.id}&reviewId=${review.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked);
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchLikeStatus();
  }, [user, review.id]);

  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || !user) return;
    setIsLoading(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    try {
      const response = await fetch("/api/likes/review", {
        method: newLikedState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, reviewId: review.id }),
      });
      if (!response.ok) throw new Error("Failed to update like status");
    } catch (error) {
      console.error("Like operation failed:", error);
      setIsLiked(!newLikedState);
      setLikeCount(prev => !newLikedState ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-[#5C5537]/70">{review.timestamp}</div>
        </div>
        <div className="mb-1 text-sm text-[#5C5537] flex items-center min-w-0 gap-2">
          <div className="flex-1 min-w-0 truncate">
            <span className="font-semibold">{review.track.title}</span>
            <span className="text-[#5C5537]/70"> by {review.track.artist}</span>
          </div>
          {review.rating !== undefined && (
            <div className="flex-shrink-0 flex items-center text-[#FFBA00] text-sm">
              <Star className="h-4 w-4 mr-1 fill-current" />
              <span>{review.rating}</span>
            </div>
          )}
        </div>
        {review.text && (
          <div className="text-sm text-[#5C5537]/90 line-clamp-3 group-hover:text-[#5C5537] transition-colors">
            {review.text}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <Link
            href={review.track.type === "album" ? `/albums/${review.track.id}` : `/songs/${review.track.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
          >
            {review.track.type === "album" ? "View album" : "View track"}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLikeClick}
              disabled={isLoading || !user}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked ? "text-[#5C5537]" : "text-[#5C5537]/40 hover:text-[#5C5537]/70"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
              {likeCount > 0 && <span className={isLiked ? "font-medium" : ""}>{likeCount}</span>}
            </button>
            {(review.is_public !== false) && (
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="text-[#5C5537]/40 hover:text-[#5C5537] transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Improved modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#FFFBEb] rounded-xl w-full max-w-lg border border-[#5C5537]/20 shadow-xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#5C5537]/10 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#5C5537]">Review</span>
                <Link
                  href={`/reviews/${review.id}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#5C5537]/35 hover:text-[#5C5537] transition-colors"
                  aria-label="Open review page"
                >
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5C5537]/60 hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-5 space-y-5">
              {/* Track info with cover art */}
              <div className="flex gap-4 items-start">
                {review.track.cover_url && (
                  <img
                    src={review.track.cover_url}
                    alt={review.track.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#5C5537] text-lg leading-tight">{review.track.title}</h3>
                  <p className="text-[#5C5537]/70 text-sm mt-0.5">{review.track.artist}</p>
                  {review.rating !== undefined && (
                    <div className="flex items-center gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i <= review.rating! ? "text-[#FFBA00] fill-[#FFBA00]" : "text-[#5C5537]/20"}`}
                        />
                      ))}
                      <span className="text-[#5C5537] text-sm ml-1.5">{review.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review text */}
              <div className="border-t border-[#5C5537]/10 pt-4 text-[#5C5537] text-sm leading-relaxed whitespace-pre-wrap">
                {review.text || <span className="italic text-[#5C5537]/50">No written review.</span>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-[#5C5537]/10 px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-[#5C5537]/60">{review.timestamp}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLikeClick}
                  disabled={isLoading || !user}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isLiked ? "text-[#5C5537]" : "text-[#5C5537]/50 hover:text-[#5C5537]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
                  <span className={isLiked ? "font-medium" : ""}>{likeCount > 0 ? likeCount : ""}</span>
                  <span className="text-xs">{isLiked ? "Liked" : "Like"}</span>
                </button>
                <Link
                  href={review.track.type === "album" ? `/albums/${review.track.id}` : `/songs/${review.track.id}`}
                  className="text-xs text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
                >
                  {review.track.type === "album" ? "View album" : "View track"}
                </Link>
                {(review.is_public !== false) && (
                  <button
                    onClick={() => setShareOpen(true)}
                    className="text-[#5C5537]/50 hover:text-[#5C5537] transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareSheet type="review" id={review.id} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
};

export default ProfileReviewCard;
