"use client";

// FavoriteTracks.tsx
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FavoriteTracksEditor from "./FavoriteTracksEditor";

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
  const [isEditing, setIsEditing] = useState(false);
  const [currentTracks, setCurrentTracks] = useState(tracks);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleTracksUpdate = (updatedTracks: Track[]) => {
    setCurrentTracks(updatedTracks);
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
  };

  // Don't render the section if there are no tracks and it's not the user's own profile
  if (currentTracks.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#5C5537]">My top 4 tracks are...</h2>
        {isOwnProfile && (
          <Button 
            variant="outline" 
            className="border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] hover:bg-[#5C5537]/10"
            onClick={handleEditClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
      
      <div className={`grid ${currentTracks.length === 3 ? "grid-cols-3 gap-3" : "grid-cols-2 gap-4"} sm:grid-cols-4 sm:gap-4`}>
        {currentTracks.map((track) => (
          <Link key={track.id} href={`/songs/${track.id}`}>
            <div className="group cursor-pointer">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[#5C5537]/10 transition-opacity group-hover:opacity-90">
                <img
                  src={track.cover_url || "/default-avatar.jpg"}
                  alt={`${track.name} cover`}
                  className="w-full h-full object-cover transition-transform duration-300 "
                />
              </div>
              <div className="pt-2">
                <div className="font-bold text-[#5C5537] truncate text-sm">{track.name}</div>
                <div className="text-xs text-[#6B6547] truncate">{track.artist}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Favorite Tracks Editor Modal */}
      {isEditing && (
        <FavoriteTracksEditor
          tracks={currentTracks}
          onTracksUpdate={handleTracksUpdate}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

export default FavoriteTracks;