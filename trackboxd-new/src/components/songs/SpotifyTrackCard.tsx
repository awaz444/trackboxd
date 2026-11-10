import React from "react";
import Link from "next/link";
import { Heart, Star, MessageCircle } from "lucide-react";
import { SpotifyTrack } from "@/app/tracks/types";
import { pendingClass } from "@/components/ui/skeleton";

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
        <div className="group">
            <Link href={`/songs/${track.id}`}>
                <div className="cursor-pointer">
                    <div className="w-full aspect-square relative overflow-hidden rounded-xl bg-[#5C5537]/10 transition-opacity group-hover:opacity-90">
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

                    <div className="pt-3 pb-2">
                        <div>
                            <h3 className="font-semibold text-[#5C5537] hover:text-[#5C5537]/80 transition-colors">
                                {track.name}
                            </h3>
                            <p className="text-[#6B6547] text-sm truncate">
                                {track.artists.map((a) => a.name).join(", ")}
                            </p>
                            <p className="text-[#6B6547] text-xs truncate">
                                {track.album.name}
                            </p>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="pb-2">
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
                                : "bg-[#5C5537]/10 text-[#5C5537] hover:bg-[#5C5537]/15"
                        } ${isLoading ? pendingClass : ""}`}>
                        <Heart className="w-3 h-3" />
                        <span>{isLiked ? "Liked" : "Like"}</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onReviewClick(track);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm bg-[#5C5537]/10 text-[#5C5537] hover:bg-[#5C5537]/15 transition-colors">
                        <Star className="w-3 h-3" />
                        <span>Review</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onAnnotationClick(track);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-[#5C5537]/10 text-[#5C5537] hover:bg-[#5C5537]/15 transition-colors">
                        <MessageCircle className="w-3 h-3" />
                        <span>Annotate</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpotifyTrackCard;