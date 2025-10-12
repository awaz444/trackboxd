// AnnotationForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useUser from "@/hooks/useUser";

interface InitialAnnotation {
  id: string;
  text: string;
  timestamp: number;
  isPublic: boolean;
  track?: SimplifiedTrack;
}

interface SimplifiedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  coverArt: string;
}

interface AnnotationFormProps {
  onClose: () => void;
  initialTrack?: SimplifiedTrack;
  initialAnnotation?: InitialAnnotation;
  onSave?: (annotation: InitialAnnotation) => void;
}

const AnnotationForm: React.FC<AnnotationFormProps> = ({ 
  onClose, 
  initialTrack, 
  initialAnnotation,
  onSave
}) => {
  const { user, loading: userLoading, error: userError } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<SimplifiedTrack | null>(
    initialTrack || null
  );
  const [timestamp, setTimestamp] = useState("");
  const [annotationText, setAnnotationText] = useState("");
  const [searchResults, setSearchResults] = useState<SimplifiedTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [trendingTracks, setTrendingTracks] = useState<SimplifiedTrack[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Removed visibility state: annotations are public by default

  // Fetch trending tracks on mount
  useEffect(() => {
    const fetchTrendingTracks = async () => {
      try {
        setIsLoadingTrending(true);
        const res = await fetch("/api/songs/global-top-4");
        if (!res.ok) throw new Error("Failed to fetch trending tracks");
        
        const data = await res.json();
        const tracks = data.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(", "),
          album: item.track.album.name,
          coverArt: item.track.album.images[0]?.url || "/default-album.png"
        }));
        
        // Select 3 random trending tracks
        const shuffled = [...tracks].sort(() => 0.5 - Math.random());
        setTrendingTracks(shuffled.slice(0, 3));
      } catch (error) {
        console.error("Error fetching trending tracks:", error);
      } finally {
        setIsLoadingTrending(false);
      }
    };

    fetchTrendingTracks();
  }, []);

  useEffect(() => {
    if (initialAnnotation) {
      setSelectedTrack({
        id: initialAnnotation.track?.id || '',
        name: initialAnnotation.track?.name || '',
        artist: initialAnnotation.track?.artist || '',
        album: initialAnnotation.track?.album || '',
        coverArt: initialAnnotation.track?.coverArt || ''
      });
      
      // Convert seconds to mm:ss format
      const minutes = Math.floor(initialAnnotation.timestamp / 60);
      const seconds = Math.floor(initialAnnotation.timestamp % 60);
      setTimestamp(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      setAnnotationText(initialAnnotation.text);
    }
  }, [initialAnnotation]);

  // Debounce search requests
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const handler = setTimeout(() => {
      searchSpotify(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchSpotify = async (query: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error("Failed to search");
      }
      const data = await res.json();
      
      // Convert Spotify tracks to simplified format
      const results = data.tracks?.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        album: track.album.name,
        coverArt: track.album.images[0]?.url || "/default-album.png"
      })) || [];
      
      setSearchResults(results);
    } catch (error) {
      console.error("Spotify search error:", error);
      setSearchError("Failed to search. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrack) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert timestamp from mm:ss to seconds
      const timeParts = timestamp.split(':');
      let timestampInSeconds = 0;
      if (timeParts.length === 1) {
        // Only seconds provided
        timestampInSeconds = parseFloat(timeParts[0]);
      } else if (timeParts.length === 2) {
        // Minutes and seconds provided
        timestampInSeconds = (parseInt(timeParts[0]) * 60) + parseFloat(timeParts[1]);
      } else {
        throw new Error('Invalid timestamp format. Use mm:ss or ss');
      }

      if (isNaN(timestampInSeconds)) {
        throw new Error('Invalid timestamp value');
      }

      const url = initialAnnotation 
        ? `/api/annotate/actions/${initialAnnotation.id}`
        : '/api/annotate';
      
      const method = initialAnnotation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // For edit mode, we don't send trackId; preserve existing privacy
          ...(initialAnnotation ? { isPublic: initialAnnotation.isPublic } : { trackId: selectedTrack.id, isPublic: true }),
          timestamp: timestampInSeconds,
          text: annotationText,
          userId: user?.id
        })
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create annotation');
      }

      const annotationData = await response.json();
      
      if (initialAnnotation && onSave) {
        onSave({
          ...initialAnnotation,
          text: annotationText,
          timestamp: timestampInSeconds,
          // Preserve existing privacy on edit
          isPublic: initialAnnotation.isPublic
        });
      }
      
      console.log('Annotation saved:', annotationData);
      onClose();
    } catch (error) {
      console.error('Annotation submission error:', error);
      
      // Simplify error message for HTML responses
      let errorMessage = 'Failed to create annotation';
      if (error instanceof Error) {
        errorMessage = error.message.includes('Invalid response: <!DOCTYPE')
          ? 'Server error: Please try again later'
          : error.message;
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
     {!initialAnnotation && !selectedTrack ? (
        <div className="space-y-4">
          <h3 className="font-medium text-[#5C5537]">
            Search for a track to annotate
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5C5537]/50" />
            <Input
              type="search"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-3 rounded-md bg-[#FFFBEb] border border-[#5C5537]/20 text-[#5C5537]"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-[#5C5537] animate-spin" />
              </div>
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-[#5C5537]/50" />
              </button>
            )}
          </div>

          {searchError && (
            <p className="text-red-500 text-sm">{searchError}</p>
          )}

          {/* Content Area */}
          <div className="border rounded-lg p-4 bg-[#FFFBEb] border-[#5C5537]/20">
            {searchQuery ? (
              // Search Results
              searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 hover:bg-[#5C5537]/5 rounded-lg cursor-pointer"
                      onClick={() => setSelectedTrack(track)}
                    >
                      <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
                        <img
                          src={track.coverArt}
                          alt={`${track.name} cover`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-[#5C5537] truncate">
                          {track.name}
                        </h4>
                        <p className="text-sm text-[#5C5537]/70 truncate">
                          {track.artist}
                        </p>
                        <p className="text-xs text-[#5C5537]/50 truncate">
                          {track.album}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#5C5537]/50">
                  <Music className="w-12 h-12 mx-auto mb-2" />
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )
            ) : (
              // Trending Tracks
              <>
                <h4 className="text-sm font-medium text-[#5C5537] mb-3">
                  Trending This Week
                </h4>
                {isLoadingTrending ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-8 h-8 text-[#5C5537] animate-spin" />
                  </div>
                ) : trendingTracks.length > 0 ? (
                  <div className="space-y-3">
                    {trendingTracks.map((track) => (
                      <div
                        key={`trending-${track.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-[#5C5537]/5 rounded-lg cursor-pointer"
                        onClick={() => setSelectedTrack(track)}
                      >
                        <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
                          <img
                            src={track.coverArt}
                            alt={`${track.name} cover`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-[#5C5537] truncate">
                            {track.name}
                          </h4>
                          <p className="text-sm text-[#5C5537]/70 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#5C5537]/50">
                    <Music className="w-12 h-12 mx-auto mb-2" />
                    <p>No trending tracks available</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : selectedTrack ? ( // Add explicit null check here
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[#5C5537]">
              Annotating: <span className="font-bold">{selectedTrack.name}</span>
            </h3>
            <button
              type="button"
              onClick={() => setSelectedTrack(null)}
              className="text-[#5C5537]/50 hover:text-[#5C5537]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#FFFBEb] rounded-lg border border-[#5C5537]/20">
            <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
              <img
                src={selectedTrack.coverArt}
                alt={`${selectedTrack.name} cover`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-[#5C5537] truncate">
                {selectedTrack.name}
              </h4>
              <p className="text-sm text-[#5C5537]/70 truncate">
                {selectedTrack.artist}
              </p>
              <p className="text-xs text-[#5C5537]/50 truncate">
                {selectedTrack.album}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5C5537] mb-2">
                Timestamp (mm:ss or ss)
              </label>
              <Input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="e.g., 1:23 or 83"
                className="w-32 border-[#5C5537]/20 text-[#5C5537] bg-[#FFFBEb]"
              />
              <p className="text-xs text-[#5C5537]/50 mt-1">
                Enter the time where your annotation applies
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C5537] mb-2">
                Annotation
              </label>
              <textarea
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Add your annotation..."
                className="w-full p-3 rounded-md border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] min-h-[120px] focus:outline-none focus:ring-1 focus:ring-[#5C5537]"
              />
            </div>

            {/* Private visibility option removed: annotations are always public */}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {submitError && (
              <p className="text-red-500 text-sm">{submitError}</p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/5"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#5C5537] hover:bg-[#3E3725] text-white"
                disabled={!timestamp || !annotationText || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </div>
                ) : "Post Annotation"}
              </Button>
            </div>
          </div>
        </div>
      ) : null} 
    </form>
  );
};

export default AnnotationForm;