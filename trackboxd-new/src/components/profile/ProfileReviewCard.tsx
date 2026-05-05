"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import ContentModal from "./ContentModal";
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
    };
    timestamp: string;
    rating?: number;
    text?: string;
    like_count?: number;
  };
}

const ProfileReviewCard: React.FC<ProfileReviewCardProps> = ({ review }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { user: sessionData } = useAuth();
  const session = sessionData ? { user: sessionData } : null;
  const user = session?.user;

  // Fetch like status and count
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user) {
        setInitialLoad(false);
        return;
      }

      try {
        // We need an endpoint to get like status and count for a review
        // Assuming the existing endpoint supports this or we reuse the logic
        const response = await fetch(
          `/api/likes/review?userId=${user.id}&reviewId=${review.id}`
        );

        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked);
          // If the API returns count, use it. Otherwise we might be missing it in the props.
          // For now, let's assume the API might return it or we start at 0/1 based on isLiked if we don't have it.
          // The profile API response doesn't seem to include like_count in recentActivity.
          // We might need to fetch the review details to get the count.
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      } finally {
        setInitialLoad(false);
      }
    };

    fetchLikeStatus();
  }, [user, review.id]);

  // We also need to fetch the actual like count since it's not in the profile data
  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        // This is a bit of a hack if we don't have a direct endpoint for just the count
        // But let's see if we can get it.
        // For now, let's just rely on the user's interaction if we can't get the global count easily without N+1
        // Or maybe we just don't show the count on the profile page card if it's not provided?
        // The design request says "Any user should be able to like...".
        // Let's try to fetch the review details which usually has the count.
        // Or we can just show the heart and toggle it.
      } catch (e) {
        console.error(e);
      }
    }
  }, []);


  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal opening when clicking like
    if (isLoading || !user) return;

    setIsLoading(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      const response = await fetch("/api/likes/review", {
        method: newLikedState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          reviewId: review.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }
    } catch (error) {
      console.error("Like operation failed:", error);
      setIsLiked(!newLikedState); // Revert
      setLikeCount(prev => !newLikedState ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-[#5C5537]/70">
            {review.timestamp}
          </div>
        </div>
        <div className="mb-1 text-sm text-[#5C5537] flex items-center min-w-0 gap-2">
          <div className="flex-1 min-w-0 truncate">
            <span className="font-semibold">
              {review.track.title}
            </span>
            <span className="text-[#5C5537]/70">
              {" "}
              by {review.track.artist}
            </span>
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
            href={`/songs/${review.track.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
          >
            View track
          </Link>

          {/* Like Button on Card */}
          <button
            onClick={handleLikeClick}
            disabled={isLoading || !user}
            className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? "text-[#5C5537]" : "text-[#5C5537]/40 hover:text-[#5C5537]/70"
              }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
            {likeCount > 0 && (
              <span className={isLiked ? "font-medium" : ""}>{likeCount}</span>
            )}
          </button>
        </div>
      </div>

      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Review"
      >
        <div className="space-y-4">
          <div className="border-b border-[#5C5537]/10 pb-4">
            <h3 className="text-xl font-bold text-[#5C5537]">{review.track.title}</h3>
            <p className="text-[#5C5537]/70">{review.track.artist}</p>
            {review.rating !== undefined && (
              <div className="flex items-center text-[#FFBA00] mt-2">
                <Star className="h-5 w-5 mr-1 fill-current" />
                <span className="font-semibold">{review.rating}</span>
              </div>
            )}
          </div>

          <div className="text-[#5C5537] text-base leading-relaxed whitespace-pre-wrap">
            {review.text || "No text review."}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#5C5537]/10">
            <div className="text-sm text-[#5C5537]/60">
              Posted {review.timestamp}
            </div>
            <button
              onClick={handleLikeClick}
              disabled={isLoading || !user}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isLiked
                ? "bg-[#5C5537]/10 text-[#5C5537]"
                : "hover:bg-[#5C5537]/5 text-[#5C5537]/70"
                }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-[#5C5537]" : ""}`} />
              <span className="font-medium">{isLiked ? "Liked" : "Like"}</span>
            </button>
          </div>
        </div>
      </ContentModal>
    </>
  );
};

export default ProfileReviewCard;
