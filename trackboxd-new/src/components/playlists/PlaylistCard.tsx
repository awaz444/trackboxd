import { Heart } from "lucide-react";
import { useState } from "react";
import { Playlist } from "@/app/playlists/types";
import Link from "next/link";

interface PlaylistCardProps {
    playlist: Playlist;
    isLiked: boolean;
    isLoading: boolean;
    onLikeToggle: (id: string) => void;
}

export const PlaylistCard = ({
    playlist,
    isLiked,
    isLoading,
    onLikeToggle,
}: PlaylistCardProps) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLikeClick = () => {
        setIsAnimating(true);
        onLikeToggle(playlist.id);
        setTimeout(() => setIsAnimating(false), 500);
    };

    return (
        <Link href={`/playlists/${playlist.id}`} className="group">
        <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
            {/* Cover Art */}
            <div className="relative">
                <img
                    src={playlist.cover_url}
                    alt={playlist.name}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                        e.currentTarget.src = "/default-playlist.jpg";
                    }}
                />
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-grow">
                        <h3 className="font-bold text-[#5C5537] truncate text-base md:text-lg">
                            {playlist.name}
                        </h3>
                        <p className="text-[#5C5537]/70 truncate mt-1 text-xs md:text-sm">
                            by {playlist.creator}
                        </p>
                    </div>
                    {/* top-right cleared for cleaner mobile layout */}
                </div>

                {/* Description */}
                {playlist.description && (
                    <p className="text-[#5C5537] text-sm my-3 line-clamp-2 flex-grow">
                        {playlist.description}
                    </p>
                )}

                {/* Bottom row with stats and like on right */}
                <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-1 text-[#5C5537]/70 text-xs md:text-sm">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 md:h-4 md:w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <span>{playlist.tracks || 0} tracks</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLikeClick(); }}
                            disabled={isLoading}
                            className={`group flex-shrink-0 p-2 rounded-full transition-colors ${
                                !isLoading ? "hover:bg-[#5C5537]/10 cursor-pointer" : "cursor-not-allowed"
                            }`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#5C5537]"></div>
                                </div>
                            ) : (
                                <Heart
                                    className={`w-5 h-5 transition-colors ${
                                        isLiked ? "text-[#5C5537] fill-[#5C5537]" : "text-[#5C5537]/50 group-hover:text-[#5C5537]"
                                    }`}
                                />
                            )}
                        </button>
                        <span className={`text-sm ${isLiked ? "text-[#5C5537] font-medium" : "text-[#5C5537]/70"}`}>
                            {playlist.like_count}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        </Link>
    );
};