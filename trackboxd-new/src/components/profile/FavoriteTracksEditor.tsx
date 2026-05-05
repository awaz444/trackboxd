// FavoriteTracksEditor.tsx
"use client";

import React, { useState } from "react";
import { Plus, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleAddTrack = async (track: any) => {
    if (tracks.length >= 4) {
      alert("You can only select up to 4 favorite tracks.");
      return;
    }
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
      setSearchQuery("");
      setSearchResults([]);
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

          {/* Add Track Modal-like Section */}
          {isAddingTrack && (
            <div className="mt-6 p-4 border border-[#5C5537]/20 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-[#5C5537]">Pick up to 4 tracks</h3>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingTrack(false)}
                  className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative mb-4">
                <Input
                  type="search"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={async (e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    if (!q.trim()) {
                      setSearchResults([]);
                      return;
                    }
                    setIsSearching(true);
                    try {
                      const res = await fetch(`/api/tracks/search?q=${encodeURIComponent(q)}`);
                      const data = await res.json();
                      const items = Array.isArray(data) ? data : data?.tracks?.items || [];
                      const results = items.map((track: any) => ({
                        id: track.id,
                        name: track.name,
                        artists: track.artists?.map((a: any) => a.name).join(', '),
                        album: track.album?.name,
                        cover: track.album?.images?.[0]?.url,
                      }));
                      setSearchResults(results);
                    } catch (e) {
                      setSearchResults([]);
                    } finally {
                      setIsSearching(false);
                    }
                  }}
                  className="pl-3 pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#5C5537] animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-8 text-[#5C5537]/50">
                    <Music className="w-12 h-12 mx-auto mb-2" />
                    <p>{searchQuery ? `No results for "${searchQuery}"` : 'Search for tracks to add'}</p>
                  </div>
                )}
                {searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 hover:bg-[#5C5537]/5 rounded-lg cursor-pointer"
                    onClick={() => handleAddTrack({ id: t.id, name: t.name, artist: t.artists, coverArt: t.cover })}
                  >
                    <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
                      <img src={t.cover || '/default-avatar.jpg'} alt={`${t.name} cover`} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-[#5C5537] truncate">{t.name}</h4>
                      <p className="text-sm text-[#5C5537]/70 truncate">{t.artists}</p>
                      <p className="text-xs text-[#5C5537]/50 truncate">{t.album}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoriteTracksEditor;

