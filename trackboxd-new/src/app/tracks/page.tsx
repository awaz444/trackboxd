"use client";

import React, { useState, useEffect, useCallback } from "react";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import Filters from "@/components/songs/Filters";
import CompactAnnotationCard from "@/components/songs/CompactAnnotationCard";
import CompactReviewCard from "@/components/songs/CompactReviewCard";
import ReviewCard from "@/components/songs/ReviewCard";
import AnnotationCard from "@/components/songs/AnnotationCard";
import MediaCard from "@/components/MediaCard";
import { Review, Annotation, SpotifyPlaylistTrack } from "./types";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  stats?: {
    like_count: number;
    review_count: number;
    annotation_count: number;
    avg_rating: number;
  };
}

const Tracks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [globalTopTracks, setGlobalTopTracks] = useState<SpotifyTrack[]>([]);
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(true);
  const [topTracksError, setTopTracksError] = useState<string | null>(null);
  const { user } = useUser();

  const [recentlyReviewedTracks, setRecentlyReviewedTracks] = useState<Review[]>([]);
  const [popularReviews, setPopularReviews] = useState<Review[]>([]);
  const [isLoadingPopularReviews, setIsLoadingPopularReviews] = useState(false);
  const [popularAnnotations, setPopularAnnotations] = useState<Annotation[]>([]);
  const [isLoadingPopularAnnotations, setIsLoadingPopularAnnotations] = useState(false);
  const [recentlyAnnotatedTracks, setRecentlyAnnotatedTracks] = useState<Annotation[]>([]);
  const [isLoadingRecentlyAnnotated, setIsLoadingRecentlyAnnotated] = useState(false);
  const [recentlyAnnotatedError, setRecentlyAnnotatedError] = useState<string | null>(null);
  const [trackboxdTrending, setTrackboxdTrending] = useState<any[]>([]);
  const [isLoadingTrackboxdTrending, setIsLoadingTrackboxdTrending] = useState(false);

  // Collect like statuses for initial isLiked prop on MediaCards
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  const fetchLikeStatuses = useCallback(
    async (trackIds: string[]) => {
      if (!user) return;
      const statuses = await Promise.all(
        trackIds.map((trackId) =>
          fetch(`/api/likes/track?userId=${user.id}&trackId=${trackId}`)
            .then((r) => r.json())
            .then((d) => ({ trackId, isLiked: d.isLiked }))
            .catch(() => ({ trackId, isLiked: false }))
        )
      );
      setLikes((prev) => {
        const next = { ...prev };
        statuses.forEach(({ trackId, isLiked }) => { next[trackId] = isLiked; });
        return next;
      });
    },
    [user]
  );

  useEffect(() => {
    const fetchGlobalTopTracks = async () => {
      try {
        setIsLoadingTopTracks(true);
        const res = await fetch("/api/tracks/global-top-4");
        if (!res.ok) throw new Error("Failed to fetch global top tracks");
        const data = (await res.json()) as SpotifyPlaylistTrack[];
        const tracks = data.map((item) => item.track);
        setGlobalTopTracks(tracks);
        if (user && tracks.length > 0) fetchLikeStatuses(tracks.map((t) => t.id).filter(Boolean));
      } catch {
        setTopTracksError("Failed to load global top tracks");
      } finally {
        setIsLoadingTopTracks(false);
      }
    };
    fetchGlobalTopTracks();
  }, []);

  useEffect(() => {
    if (user && globalTopTracks.length > 0) fetchLikeStatuses(globalTopTracks.map((t) => t.id));
  }, [globalTopTracks, user, fetchLikeStatuses]);

  useEffect(() => {
    const fetchAnnotated = async () => {
      setIsLoadingRecentlyAnnotated(true);
      try {
        const res = await fetch("/api/annotations/last-annotated-tracks");
        if (!res.ok) throw new Error();
        setRecentlyAnnotatedTracks(await res.json());
      } catch {
        setRecentlyAnnotatedError("Failed to load recently annotated tracks");
      } finally {
        setIsLoadingRecentlyAnnotated(false);
      }
    };
    fetchAnnotated();

    setIsLoadingTrackboxdTrending(true);
    fetch("/api/tracks/trending-trackboxd")
      .then((r) => r.json())
      .then((data) => setTrackboxdTrending(data || []))
      .catch(console.error)
      .finally(() => setIsLoadingTrackboxdTrending(false));
  }, []);

  useEffect(() => {
    if (showSearchResults) return;
    setIsLoadingPopularAnnotations(true);
    fetch("/api/annotations/popular-this-week")
      .then((r) => r.json())
      .then((data) => setPopularAnnotations(data))
      .catch(console.error)
      .finally(() => setIsLoadingPopularAnnotations(false));
  }, [showSearchResults]);

  useEffect(() => {
    if (showSearchResults) return;
    setIsLoadingPopularReviews(true);
    fetch("/api/reviews/popular-this-week")
      .then((r) => r.json())
      .then((data) => setPopularReviews(data))
      .catch(console.error)
      .finally(() => setIsLoadingPopularReviews(false));
  }, [showSearchResults]);

  useEffect(() => {
    fetch("/api/reviews/last-reviewed-tracks")
      .then((r) => r.json())
      .then((data) => setRecentlyReviewedTracks(data))
      .catch(console.error);
  }, []);

  const searchSpotify = async (query: string) => {
    if (!query) { setSearchError(null); setShowSearchResults(false); return; }
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/tracks/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.error || "Failed to search");
      }
      const data = await res.json();
      const items: SpotifyTrack[] = Array.isArray(data) ? data : data?.tracks?.items || [];
      setSearchResults(items);
      setShowSearchResults(true);
      if (user && items.length > 0) fetchLikeStatuses(items.map((t) => t.id));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to search. Please try again.");
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Filters
          selectedGenre="" setSelectedGenre={() => {}}
          selectedMood="" setSelectedMood={() => {}}
          selectedYear="" setSelectedYear={() => {}}
          selectedRating="" setSelectedRating={() => {}}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSearching={isSearching}
          searchError={searchError}
          searchSpotify={searchSpotify}
        />

        {/* Search Results */}
        {showSearchResults && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#5C5537]">
                Search Results for <span>"{searchTerm}"</span>
              </h2>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-sm text-[#5C5537]/70 hover:text-[#5C5537]"
              >
                Clear results
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {searchResults.map((track) => (
                  <MediaCard
                    key={`search-${track.id}`}
                    coverUrl={track.album?.images?.[0]?.url || ""}
                    name={track.name}
                    artist={track.artists?.map((a) => a.name).join(", ")}
                    avgRating={track.stats?.avg_rating}
                    likeCount={track.stats?.like_count}
                    reviewCount={track.stats?.review_count}
                    annotationCount={track.stats?.annotation_count}
                    itemType="track"
                    itemId={track.id}
                    isLiked={likes[track.id] || false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[#5C5537]/70">No results found</p>
            )}
          </div>
        )}

        {!showSearchResults && (
          <>
            {/* Trending This Week — Spotify */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">
                Trending This Week Globally
              </h2>
              {isLoadingTopTracks ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]" />
                </div>
              ) : topTracksError ? (
                <p className="text-[#5C5537]">{topTracksError}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {globalTopTracks.map((track) => (
                    <MediaCard
                      key={`trending-${track.id}`}
                      coverUrl={track.album?.images?.[0]?.url || ""}
                      name={track.name}
                      artist={track.artists?.map((a) => a.name).join(", ")}
                      itemType="track"
                      itemId={track.id}
                      isLiked={likes[track.id] || false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Trending on Trackboxd This Week */}
            {(isLoadingTrackboxdTrending || trackboxdTrending.length > 0) && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#5C5537] mb-6">
                  Trending on Trackboxd This Week
                </h2>
                {isLoadingTrackboxdTrending ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {trackboxdTrending.map((track: any) => (
                      <MediaCard
                        key={`tb-trending-${track.id}`}
                        coverUrl={track.cover_url || ""}
                        name={track.name}
                        artist={track.artist}
                        avgRating={track.avg_rating}
                        likeCount={track.like_count}
                        reviewCount={track.review_count}
                        annotationCount={track.annotation_count}
                        itemType="track"
                        itemId={track.id}
                        isLiked={likes[track.id] || false}
                        showPopularStats
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recently Reviewed & Annotated */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#5C5537] mb-6">Recently Reviewed</h2>
                {recentlyReviewedTracks.map((review) => (
                  <CompactReviewCard key={`reviewed-${review.id}`} review={review} />
                ))}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#5C5537] mb-6">Recently Annotated</h2>
                {isLoadingRecentlyAnnotated ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]" />
                  </div>
                ) : recentlyAnnotatedError ? (
                  <p className="text-[#5C5537]">{recentlyAnnotatedError}</p>
                ) : (
                  <div className="space-y-4">
                    {recentlyAnnotatedTracks.map((annotation) => (
                      <CompactAnnotationCard key={`annotated-${annotation.id}`} annotation={annotation} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Popular Reviews This Week */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Popular Reviews This Week</h2>
              {isLoadingPopularReviews ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]" />
                </div>
              ) : popularReviews.length > 0 ? (
                <div className="space-y-4">
                  {popularReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-[#5C5537]/70">No popular reviews yet</p>
              )}
            </div>

            {/* Popular Annotations This Week */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Popular Annotations This Week</h2>
              {isLoadingPopularAnnotations ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]" />
                </div>
              ) : popularAnnotations.length > 0 ? (
                <div className="space-y-4">
                  {popularAnnotations.map((annotation) => (
                    <AnnotationCard key={annotation.id} annotation={annotation} />
                  ))}
                </div>
              ) : (
                <p className="text-[#5C5537]/70">No popular annotations yet</p>
              )}
            </div>
          </>
        )}
      </div>
      <Footer variant="light" />
    </div>
  );
};

export default Tracks;
