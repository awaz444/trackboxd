import React from "react";
import Link from "next/link";
import { Track } from "@/app/tracks/types";

interface CompactTrackCardProps {
  track: Track;
}

const CompactTrackCard: React.FC<CompactTrackCardProps> = ({ track }) => {
  return (
    <Link href={`/songs/${track.id}`}>
            <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center space-x-3 p-3">
                    <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
                        <img
                            src={track.coverArt}
                            alt={`${track.title} cover`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-medium text-[#5C5537] truncate">
                            {track.title}
                        </h3>
                        <p className="text-[#5C5537]/70 text-sm truncate">
                            {track.artist}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
  );
};

export default CompactTrackCard;