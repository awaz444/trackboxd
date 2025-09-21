// FavoriteTracks.tsx
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Track {
  id: string;
  name: string;
  artist: string;
  cover_url?: string;
}

interface FavoriteTracksProps {
  tracks: Track[];
  isOwnProfile?: boolean;
  onEditClick?: () => void;
}

const FavoriteTracks: React.FC<FavoriteTracksProps> = ({
  tracks,
  isOwnProfile = false,
  onEditClick,
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#5C5537]">Favorite Songs</h2>
        {isOwnProfile && (
          <Button 
            variant="outline" 
            className="border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] hover:bg-[#5C5537]/10"
            onClick={onEditClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tracks.map((track) => (
          <Link key={track.id} href={`/songs/${track.id}`}>
            <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg overflow-hidden group cursor-pointer">
              <div className="relative aspect-square">
                <img
                  src={track.cover_url || "/default-avatar.jpg"}
                  alt={`${track.name} cover`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-2 bg-[#FFFBEb]">
                <div className="font-bold text-[#5C5537] truncate text-sm">{track.name}</div>
                <div className="text-xs text-[#5C5537]/70 truncate">{track.artist}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FavoriteTracks;