import React from "react";
import Link from "next/link";
import { Heart, Star, MessageCircle } from "lucide-react";
import { SpotifyTrack } from "@/app/songs/types";

interface SpotifyTrackCardProps {
    track: SpotifyTrack;
    isLiked: boolean;
    isLoading: boolean;
    onLikeClick: (trackId: string) => void;
    onReviewClick: (track: SpotifyTrack) => void;
    onAnnotationClick: (track: SpotifyTrack) => void;
}

const SpotifyTrackCard: React.FC<SpotifyTrackCardProps> = ({
    track,
    isLiked,
    isLoading,
    onLikeClick,
    onReviewClick,
    onAnnotationClick,
}) => {
    return (
        <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <Link href={`/songs/${track.id}`}>
                <div className="cursor-pointer">
                    <div className="w-full h-48 relative overflow-hidden rounded-lg bg-[#5C5537]/10">
                        <img
                            src={
                                track.album.images[0]?.url ||
                                "/default-album.png"
                            }
                            alt={`${track.name} cover`}
                            className="w-full h-full object-cover transition-transform duration-200"
                            onError={(e) => {
                                e.currentTarget.src = "/default-album.png";
                            }}
                        />
                    </div>

                    <div className="mt-3 p-4">
                        <div>
                            <h3 className="font-semibold text-[#5C5537] hover:text-[#5C5537]/80 transition-colors">
                                {track.name}
                            </h3>
                            <p className="text-[#5C5537]/70 text-sm truncate">
                                {track.artists.map((a) => a.name).join(", ")}
                            </p>
                            <p className="text-[#5C5537]/70 text-xs truncate">
                                {track.album.name}
                            </p>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onLikeClick(track.id);
                        }}
                        disabled={isLoading}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            isLiked
                                ? "bg-[#FFBA00] text-[#5C5537] border border-[#FFBA00]"
                                : "bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/30 hover:bg-[#5C5537]/10 hover:border-[#5C5537]/50"
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
                        className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/30 hover:bg-[#5C5537]/10 hover:border-[#5C5537]/50 transition-colors">
                        <Star className="w-3 h-3" />
                        <span>Review</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onAnnotationClick(track);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/30 hover:bg-[#5C5537]/10 hover:border-[#5C5537]/50 transition-colors">
                        <MessageCircle className="w-3 h-3" />
                        <span>Annotate</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpotifyTrackCard;