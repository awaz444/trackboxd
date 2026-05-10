import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Review } from "@/app/tracks/types";
import { Star, Heart } from "lucide-react";
import useUser from "@/hooks/useUser";

interface CompactReviewCardProps {
  review: Review;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsAgo < 60) {
    return secondsAgo === 1 ? '1 second ago' : `${secondsAgo} seconds ago`;
  }
  
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`;
  }
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
  }
  
  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
};

const CompactReviewCard: React.FC<CompactReviewCardProps> = ({ review }) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>((review as any).like_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const targetId = (review as any).id;
      if (!user || !targetId) {
        setInitialLoad(false);
        return;
      }
      try {
        const res = await fetch(`/api/likes/review?userId=${user.id}&reviewId=${targetId}`);
        if (!res.ok) throw new Error("Failed to fetch like status");
        const data = await res.json();
        setIsLiked(!!data.isLiked);
      } catch (_e) {
        // noop
      } finally {
        setInitialLoad(false);
      }
    };
    checkLikeStatus();
  }, [user, review]);

  const handleToggleLike = async () => {
    const targetId = (review as any).id;
    if (!user || !targetId || isLoading || initialLoad) return;
    setIsLoading(true);
    const next = !isLiked;
    const optimistic = next ? likeCount + 1 : Math.max(0, likeCount - 1);
    setIsLiked(next);
    setLikeCount(optimistic);
    try {
      const res = await fetch(`/api/likes/review`, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, reviewId: targetId }),
      });
      if (!res.ok) throw new Error("Failed to toggle like");
    } catch (_e) {
      setIsLiked(!next);
      setLikeCount((review as any).like_count || 0);
    } finally {
      setIsLoading(false);
    }
  };

  const timeAgo = formatTimeAgo(review.created_at);
  const trackName = review.track_details?.name || "Unknown Track";
  
  // Add max length handling for artists
  const MAX_ARTISTS = 2;
  const artists = review.track_details?.artists || [];
  const artistNames = artists.length > MAX_ARTISTS
    ? `${artists.slice(0, MAX_ARTISTS).map(a => a.name).join(", ")} + ${artists.length - MAX_ARTISTS} more`
    : artists.map(a => a.name).join(", ") || "Unknown Artist";
  
  return (
    <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
          <img 
              src={review.users.image_url || "./default-avatar.jpg"} 
              alt={review.users.name}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "./default-avatar.jpg";
              }}
            />
            <div className="font-medium text-[#5C5537]">
              <Link href={`/profile/${encodeURIComponent(review.users.name)}`} className="hover:underline">
                {review.users.name}
              </Link>
            </div>
            <div className="flex items-center text-[#FFBA00] text-sm">
              <Star className="h-4 w-4 mr-0.5 inline" />
              <span>{review.rating}</span>
            </div>
          </div>
          
          <div className="mb-2">
            <h3 className="font-semibold text-[#5C5537] text-sm">{trackName}</h3>
            <p className="text-[#5C5537]/70 text-xs">{artistNames}</p>
          </div>

          {review.text && (
            <p className="text-[#5C5537] text-sm line-clamp-2 mb-2">
              {review.text}
            </p>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-[#5C5537]/70">
              {timeAgo}
            </span>
            <div className="flex items-center gap-3">
              {(review as any).id && (
                <button
                  onClick={handleToggleLike}
                  disabled={isLoading || initialLoad || !user}
                  className={`group flex items-center gap-1 text-xs focus:outline-none ${
                    isLoading || initialLoad || !user
                      ? "cursor-not-allowed text-[#5C5537]/40"
                      : "cursor-pointer text-[#5C5537]/70 hover:text-[#5C5537]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-[#5C5537] fill-[#5C5537]' : ''}`} />
                  <span className={`${isLiked ? 'text-[#5C5537] font-medium' : ''}`}>{likeCount}</span>
                </button>
              )}
              <Link 
                href={`/songs/${review.item_id}`} 
                className="text-xs text-[#5C5537]/70 hover:text-[#5C5537]"
              >
                View track
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactReviewCard;