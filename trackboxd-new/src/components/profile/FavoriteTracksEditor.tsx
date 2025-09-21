// FavoriteTracksEditor.tsx
"use client";

import React, { useState } from "react";
import { Plus, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnnotationForm from "@/components/log/forms/AnnotationForm";

interface Track {
  id: string;
  name: string;
  artist: string;
  cover_url?: string;
}

interface FavoriteTracksEditorProps {
  tracks: Track[];
  onTracksUpdate: (tracks: Track[]) => void;
  onClose: () => void;
}

const FavoriteTracksEditor: React.FC<FavoriteTracksEditorProps> = ({
  tracks,
  onTracksUpdate,
  onClose,
}) => {
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleAddTrack = async (track: any) => {
    try {
      const response = await fetch("/api/profile/favorite-tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackId: track.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add track");
      }

      // Add the track to the local state
      const newTrack = {
        id: track.id,
        name: track.name,
        artist: track.artist,
        cover_url: track.coverArt,
      };

      onTracksUpdate([...tracks, newTrack]);
      setIsAddingTrack(false);
    } catch (error) {
      console.error("Failed to add favorite track:", error);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    setIsRemoving(trackId);
    try {
      const response = await fetch("/api/profile/favorite-tracks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove track");
      }

      // Remove the track from local state
      onTracksUpdate(tracks.filter(track => track.id !== trackId));
    } catch (error) {
      console.error("Failed to remove favorite track:", error);
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FFFBEb] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#5C5537]">Edit Favorite Songs</h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/10"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Add Track Button */}
          <div className="mb-6">
            <Button
              onClick={() => setIsAddingTrack(true)}
              className="bg-[#5C5537] hover:bg-[#3E3725] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Track
            </Button>
          </div>

          {/* Track List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tracks.map((track) => (
              <div key={track.id} className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg overflow-hidden group relative">
                <div className="relative aspect-square">
                  <img
                    src={track.cover_url || "/default-avatar.jpg"}
                    alt={`${track.name} cover`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    disabled={isRemoving === track.id}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isRemoving === track.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="p-2">
                  <div className="font-bold text-[#5C5537] truncate text-sm">{track.name}</div>
                  <div className="text-xs text-[#5C5537]/70 truncate">{track.artist}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Track Form */}
          {isAddingTrack && (
            <div className="mt-6 p-4 border border-[#5C5537]/20 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-[#5C5537]">Add New Track</h3>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingTrack(false)}
                  className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <AnnotationForm
                onClose={() => setIsAddingTrack(false)}
                onSave={(annotation) => {
                  if (annotation.track) {
                    handleAddTrack(annotation.track);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoriteTracksEditor;
