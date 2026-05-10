import React from "react";
import Link from "next/link";
import { Heart, Star, MessageCircle } from "lucide-react";
import RatingStars from "../RatingStars";
import { Track } from "@/app/tracks/types";

interface TrackCardProps {
    track: Track;
    viewMode: "grid" | "list";
    isLiked: boolean;
    isLoading: boolean;
    onLikeClick: (trackId: string) => void;
    onReviewClick: (track: Track) => void;
    onAnnotationClick: (track: Track) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({
    track,
    viewMode,
    isLiked,
    isLoading,
    onLikeClick,
    onReviewClick,
    onAnnotationClick,
}) => {

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative">
                        <div className="w-4 h-4 mb-2 text-[#5C5537]/30">★</div>
                        <div
                            className="absolute top-0 left-0 w-5 h-5 text-[#FFBA00] overflow-hidden"
                            style={{
                                width: `${
                                    Math.max(
                                        0,
                                        Math.min(1, rating - star + 1)
                                    ) * 100
                                }%`,
                            }}>
                            ★
                        </div>
                    </div>
                ))}
                <span className="text-sm text-[#5C5537] ml-1">{rating}</span>
            </div>
        );
    };

    return (
        <Link href={`/songs/${track.id}`}>
            <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div
                    className={`p-4 ${
                        viewMode === "list" ? "flex items-center space-x-4" : ""
                    }`}>
                    <div
                        className={`${
                            viewMode === "list" ? "w-16 h-16" : "w-full aspect-square"
                        } relative overflow-hidden rounded-lg bg-[#5C5537]/10`}>
                        <img
                            src={track.coverArt}
                            alt={`${track.title} cover`}
                            className="w-full h-full object-cover cursor-pointer transition-transform duration-200"
                        />
                    </div>

                    <div
                        className={`${
                            viewMode === "list" ? "flex-1" : "mt-3"
                        }`}>
                        <div
                            className={`${
                                viewMode === "list"
                                    ? "flex items-center justify-between"
                                    : ""
                            }`}>
                            <div
                                className={`${
                                    viewMode === "list" ? "flex-1" : ""
                                }`}>
                                <h3 className="font-semibold text-[#5C5537] cursor-pointer hover:text-[#5C5537]/70 transition-colors">
                                    {track.title}
                                </h3>
                                <p className="text-[#5C5537]/70 text-sm truncate">
                                    {track.artist}
                                </p>
                                <p className="text-[#5C5537]/70 text-xs truncate">
                                    {track.album}
                                </p>
                            </div>

                            <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1 text-[#5C5537]/70">
                                    <Heart className="w-4 h-4" />
                                    <span className="text-sm">
                                        {track.stats?.like_count || 0}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1 text-[#5C5537]/70">
                                    <Star className="w-4 h-4" />
                                    <span className="text-sm">
                                        {track.stats?.review_count || 0}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1 text-[#5C5537]/70">
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-sm">
                                        {track.stats?.annotation_count || 0}
                                    </span>
                                </div>
                            </div>

                            {renderStars(track.stats?.avg_rating || 0)}
                        </div>
                    </div>

                    <div
                        className={`${
                            viewMode === "list" ? "mt-2" : "mt-3"
                        } flex flex-wrap gap-2`}>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onLikeClick(track.id);
                            }}
                            disabled={isLoading}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                                isLiked
                                    ? "bg-[#5C5537] text-[#FFFBEb]"
                                    : "bg-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/30"
                            }`}>
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5C5537]"></div>
                            ) : (
                                <>
                                    <Heart className="w-3 h-3" />
                                    <span>{isLiked ? "Liked" : "Like"}</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onReviewClick(track);
                            }}
                            className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/20 hover:bg-[#5C5537]/10 transition-colors">
                            <Star className="w-3 h-3" />
                            <span>Review</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onAnnotationClick(track);
                            }}
                            className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/20 hover:bg-[#5C5537]/10 transition-colors">
                            <MessageCircle className="w-3 h-3" />
                            <span>Annotate</span>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default TrackCard;