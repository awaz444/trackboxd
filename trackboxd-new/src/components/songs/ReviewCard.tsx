import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { Review } from "@/app/songs/types";
import useUser from "@/hooks/useUser";

interface ReviewCardProps {
    review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(review.like_count);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const { user } = useUser();

    // Check if user has liked this review on component mount
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!user) {
                setInitialLoad(false);
                return;
            }
            
            try {
                const response = await fetch(
                    `/api/like/review?userId=${user.id}&reviewId=${review.id}`
                );
                
                if (!response.ok) {
                    throw new Error("Failed to fetch like status");
                }
                
                const data = await response.json();
                setIsLiked(data.isLiked);
            } catch (error) {
                console.error("Error checking like status:", error);
            } finally {
                setInitialLoad(false);
            }
        };

        checkLikeStatus();
    }, [user, review.id]);

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

    const handleLikeClick = async () => {
        if (isLoading || !user || initialLoad) return;

        setIsLoading(true);
        setIsAnimating(true);

        try {
            const newLikedState = !isLiked;
            const newCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);

            // Optimistic UI update
            setIsLiked(newLikedState);
            setLikeCount(newCount);

            const response = await fetch("/api/like/review", {
                method: newLikedState ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    reviewId: review.id,
                }),
            });

            if (!response.ok) throw new Error("Failed to update like status");

            setTimeout(() => setIsAnimating(false), 500);
        } catch (error) {
            console.error("Like operation failed:", error);
            setIsLiked(!isLiked);
            setLikeCount(review.like_count);
        } finally {
            setIsLoading(false);
        }
    };

    const trackName = review.track_details?.name || "Unknown Track";
    const artistNames = review.track_details?.artists?.map(a => a.name).join(", ") || "Unknown Artist";
    const userImage = review.users.image_url || "./default-avatar.jpg";
    const timeAgo = formatTimeAgo(review.created_at);
    
    return (
        <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <img 
                            src={userImage} 
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
                            <button 
                                onClick={handleLikeClick}
                                disabled={isLoading || initialLoad || !user}
                                className={`group flex items-center gap-1 text-xs focus:outline-none ${
                                    isLoading || initialLoad || !user
                                        ? 'cursor-not-allowed text-[#5C5537]/40'
                                        : 'cursor-pointer text-[#5C5537]/70 hover:text-[#5C5537]'
                                }`}
                            >
                                {initialLoad ? (
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#5C5537]"></div>
                                    </div>
                                ) : (
                                    <Heart 
                                        className={`w-4 h-4 ${
                                            isLiked ? 'text-[#5C5537] fill-[#5C5537]' : ''
                                        }`}
                                    />
                                )}
                                <span className={`${isLiked ? 'text-[#5C5537] font-medium' : ''}`}>
                                    {likeCount}
                                </span>
                            </button>
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

export default ReviewCard;