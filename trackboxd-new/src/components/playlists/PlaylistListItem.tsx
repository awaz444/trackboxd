import { Heart } from "lucide-react";
import { Playlist } from "@/app/playlists/types";
import Link from "next/link";

interface PlaylistListItemProps {
  playlist: Playlist;
  onLikeToggle: (id: string) => void;
  isLastItem?: boolean;
  isLiked: boolean;
  isLoading?: boolean;
}

export const PlaylistListItem = ({
  playlist,
  onLikeToggle,
  isLastItem = false,
  isLiked,
  isLoading = false,
}: PlaylistListItemProps) => {
  return (
    <Link href={`/playlists/${playlist.id}`} className="group">
    <div
      className={`p-4 hover:bg-[#5C5537]/5 transition-colors ${
        !isLastItem ? "border-b border-[#5C5537]/20" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <img
            src={playlist.cover_url}
            alt={playlist.name}
            className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover"
            onError={(e) => {
              e.currentTarget.src = "/default-playlist.jpg";
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-[#5C5537] truncate text-sm md:text-base">
                {playlist.name}
              </h3>
              <p className="text-[#5C5537]/70 truncate text-xs md:text-sm">
                by {playlist.creator}
              </p>
            </div>
            {/* move like to bottom row for mobile */}
          </div>

          <p className="text-[#5C5537] text-xs md:text-sm my-2 line-clamp-2">
            {playlist.description}
          </p>

          {/* Stats - only track count remains */}
          <div className="flex items-center justify-between text-[#5C5537]/70 text-xs">
            <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isLoading) onLikeToggle(playlist.id); }}
                disabled={isLoading}
                className={`p-1 ${isLoading ? "cursor-not-allowed" : "cursor-pointer"} ${isLiked ? "text-[#5C5537]" : "text-[#5C5537]/50 hover:text-[#5C5537]"}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#5C5537]"></div>
                  </div>
                ) : (
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-[#5C5537]" : ""}`} />
                )}
              </button>
              <span className={`text-sm ${isLiked ? 'text-[#5C5537] font-medium' : 'text-[#5C5537]/70'}`}>{playlist.like_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
};