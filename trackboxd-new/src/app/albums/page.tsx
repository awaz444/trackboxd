"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import MediaCard from "@/components/MediaCard";
import CompactReviewCard from "@/components/songs/CompactReviewCard";
import ReviewCard from "@/components/songs/ReviewCard";

interface Album {
  id: string;
  name: string;
  creator: string;
  cover_url: string;
  like_count: number;
  tracks: number;
  release_date?: string;
  description?: string;
  review_count?: number;
  avg_rating?: number;
}

const transformAlbum = (data: any): Album => ({
  id: data.id,
  name: data.name || "Untitled Album",
  creator: data.creator || data.artists?.map((a: any) => a.name).join(", ") || "Unknown",
  cover_url: data.cover_url || data.images?.[0]?.url || "/default-album.jpg",
  tracks: data.tracks?.total || data.tracks || 0,
  like_count: data.like_count || 0,
  release_date: data.release_date,
  description: data.description,
  review_count: data.review_count || 0,
  avg_rating: data.avg_rating || 0,
});

const SkeletonCard = () => (
  <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden animate-pulse">
    <div className="aspect-square bg-[#5C5537]/10" />
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-[#5C5537]/10 rounded w-3/4" />
      <div className="h-3 bg-[#5C5537]/10 rounded w-1/2" />
    </div>
  </div>
);

const AlbumsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [recentlyLikedAlbums, setRecentlyLikedAlbums] = useState<Album[]>([]);
  const [recentlyReviewedAlbums, setRecentlyReviewedAlbums] = useState<Album[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(true);
  const [loadingReviewed, setLoadingReviewed] = useState(true);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [popularReviews, setPopularReviews] = useState<any[]>([]);
  const [loadingRecentReviews, setLoadingRecentReviews] = useState(true);
  const [loadingPopularReviews, setLoadingPopularReviews] = useState(true);
  const { user } = useUser();

  const fetchLikeStatuses = useCallback(
    async (albumIds: string[]) => {
      if (!user) return;
      const statuses = await Promise.all(
        albumIds.map((id) =>
          fetch(`/api/likes/album?userId=${user.id}&albumId=${id}`)
            .then((r) => r.json())
            .then((d) => ({ id, isLiked: d.isLiked }))
            .catch(() => ({ id, isLiked: false }))
        )
      );
      setLikes((prev) => {
        const next = { ...prev };
        statuses.forEach(({ id, isLiked }) => { next[id] = isLiked; });
        return next;
      });
    },
    [user]
  );

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const [popularRes, likedRes, reviewedRes] = await Promise.all([
          fetch("/api/albums/popular").then((r) => r.json()),
          fetch("/api/albums/recently-liked").then((r) => r.json()),
          fetch("/api/albums/recently-reviewed").then((r) => r.json()),
        ]);

        const popular = Array.isArray(popularRes) ? popularRes.map(transformAlbum) : [];
        const liked = Array.isArray(likedRes) ? likedRes.map(transformAlbum) : [];
        const reviewed = Array.isArray(reviewedRes) ? reviewedRes.map(transformAlbum) : [];

        setPopularAlbums(popular);
        setRecentlyLikedAlbums(liked);
        setRecentlyReviewedAlbums(reviewed);
        setLoadingPopular(false);
        setLoadingLiked(false);
        setLoadingReviewed(false);

        const allIds = [...popular, ...liked, ...reviewed].map((a) => a.id);
        fetchLikeStatuses(allIds);
      } catch {
        setLoadingPopular(false);
        setLoadingLiked(false);
        setLoadingReviewed(false);
      }
    };
    fetchAlbums();
  }, [fetchLikeStatuses]);

  useEffect(() => {
    fetch("/api/reviews/albums-recent")
      .then((r) => r.json())
      .then((d) => setRecentReviews(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingRecentReviews(false));

    fetch("/api/reviews/albums-popular")
      .then((r) => r.json())
      .then((d) => setPopularReviews(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingPopularReviews(false));
  }, []);

  useEffect(() => {
    if (showSearchResults && searchResults.length > 0 && user) {
      fetchLikeStatuses(searchResults.map((a) => a.id));
    }
  }, [showSearchResults, searchResults, user, fetchLikeStatuses]);

  const searchAlbums = async (query: string) => {
    if (!query) { setSearchError(null); setShowSearchResults(false); return; }
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/albums/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.error || "Failed to search");
      }
      const data = await res.json();
      let results: Album[] = [];
      if (Array.isArray(data)) results = data.filter(Boolean).map(transformAlbum);
      else if (data.albums?.items) results = data.albums.items.filter(Boolean).map(transformAlbum);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to search. Please try again.");
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const AlbumGrid = ({ albums, loading, cols = 4 }: { albums: Album[]; loading?: boolean; cols?: number }) => {
    const gridClass = cols === 5
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";

    if (loading) {
      return (
        <div className={gridClass}>
          {[...Array(cols)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }
    return (
      <div className={gridClass}>
        {albums.map((album) => (
          <MediaCard
            key={album.id}
            coverUrl={album.cover_url}
            name={album.name}
            artist={album.creator}
            avgRating={album.avg_rating}
            likeCount={album.like_count}
            reviewCount={album.review_count}
            itemType="album"
            itemId={album.id}
            isLiked={likes[album.id] || false}
            showPopularStats={!!(album.review_count || album.like_count)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with search */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#5C5537]">Albums</h1>
            <p className="text-[#5C5537]/70 mt-2">Discover and explore music collections</p>
          </div>
          <div className="w-full md:w-[320px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5537]/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); searchAlbums(e.target.value); }}
              className="w-full pl-10 pr-4 py-3 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5537]/30 text-[#5C5537] placeholder-[#5C5537]/50"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5C5537]" />
              </div>
            )}
            {searchTerm && !isSearching && (
              <button
                onClick={() => { setSearchTerm(""); setShowSearchResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5537]/50 hover:text-[#5C5537]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {searchError && <p className="text-red-500 text-sm mt-1">{searchError}</p>}
          </div>
        </div>

        {/* Search results */}
        {showSearchResults && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#5C5537]">
                Search Results for "{searchTerm}"
              </h2>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-sm text-[#5C5537]/70 hover:text-[#5C5537]"
              >
                Clear results
              </button>
            </div>
            {searchResults.length > 0 ? (
              <AlbumGrid albums={searchResults} cols={5} />
            ) : (
              <p className="text-[#5C5537]/70">{isSearching ? "Searching…" : "No albums found"}</p>
            )}
          </div>
        )}

        {!showSearchResults && (
          <>
            {/* 1. Cards — Popular This Week */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Popular This Week</h2>
              <AlbumGrid albums={popularAlbums} loading={loadingPopular} />
            </div>

            {/* 2. Text — Recent Reviews (2-col compact cards) */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Recent Reviews</h2>
              {loadingRecentReviews ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]" />
                </div>
              ) : recentReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentReviews.map((review) => (
                    <CompactReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-[#5C5537]/70">No album reviews yet</p>
              )}
            </div>

            {/* 3. Cards — Recently Liked Albums */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Recently Liked Albums</h2>
              <AlbumGrid albums={recentlyLikedAlbums} loading={loadingLiked} cols={5} />
            </div>

            {/* 4. Text — Popular Reviews */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Popular Reviews This Week</h2>
              {loadingPopularReviews ? (
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
                <p className="text-[#5C5537]/70">No popular album reviews yet</p>
              )}
            </div>

            {/* 5. Cards — Recently Reviewed Albums */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#5C5537] mb-6">Recently Reviewed Albums</h2>
              <AlbumGrid albums={recentlyReviewedAlbums} loading={loadingReviewed} cols={5} />
            </div>
          </>
        )}
      </div>
      <Footer variant="light" />
    </div>
  );
};

export default AlbumsPage;
