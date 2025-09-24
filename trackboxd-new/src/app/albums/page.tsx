"use client";

import React, { useState, useEffect } from "react";
import { Search, Grid, List, Heart, Plus, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import { useCallback } from "react";

import { AlbumCard } from "@/components/albums/AlbumCard";
import { AlbumListItem } from "@/components/albums/AlbumListItem";

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
    last_reviewed_at?: string;
}

const SkeletonAlbumCard = () => (
    <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl p-4">
        <div className="animate-pulse">
            <div className="bg-[#5C5537]/10 rounded-xl h-48 w-full mb-4"></div>
            <div className="space-y-2">
                <div className="h-4 bg-[#5C5537]/10 rounded w-3/4"></div>
                <div className="h-3 bg-[#5C5537]/10 rounded w-1/2"></div>
                <div className="h-3 bg-[#5C5537]/10 rounded w-1/3"></div>
            </div>
        </div>
    </div>
);

const SkeletonAlbumListItem = () => (
    <div className="flex items-center p-4">
        <div className="animate-pulse flex items-center w-full">
            <div className="bg-[#5C5537]/10 rounded-lg w-16 h-16"></div>
            <div className="ml-4 flex-1">
                <div className="h-4 bg-[#5C5537]/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#5C5537]/10 rounded w-1/2"></div>
            </div>
            <div className="w-20">
                <div className="h-3 bg-[#5C5537]/10 rounded w-full"></div>
            </div>
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
    const [isLoadingLikes, setIsLoadingLikes] = useState<Record<string, boolean>>({});
    const { user } = useUser();

    const [loadingPopular, setLoadingPopular] = useState(true);
    const [loadingLiked, setLoadingLiked] = useState(true);
    const [loadingReviewed, setLoadingReviewed] = useState(true);

    const fetchLikeStatuses = useCallback(
        async (albumIds: string[]) => {
            if (!user) return;

            try {
                const likeStatuses = await Promise.all(
                    albumIds.map((id) =>
                        fetch(
                            `/api/like/album?userId=${user.id}&albumId=${id}`
                        )
                            .then((res) => res.json())
                            .then((data) => ({ id, isLiked: data.isLiked }))
                            .catch(() => ({ id, isLiked: false }))
                    )
                );

                setLikes((prev) => {
                    const newLikes = { ...prev };
                    likeStatuses.forEach(({ id, isLiked }) => {
                        newLikes[id] = isLiked;
                    });
                    return newLikes;
                });
            } catch (error) {
                console.error("Failed to fetch like statuses:", error);
            }
        },
        [user]
    );

    const transformAlbum = (data: any): Album => {
        return {
            id: data.id,
            name: data.name || "Untitled Album",
            creator: data.creator || data.artists?.map((a: any) => a.name).join(", ") || "Unknown",
            cover_url: data.cover_url || data.images?.[0]?.url || "/default-album.jpg",
            tracks: data.tracks?.total || data.tracks || 0,
            like_count: data.like_count || 0,
            release_date: data.release_date,
            description: data.description,
            review_count: data.review_count,
            last_reviewed_at: data.last_reviewed_at
        };
    };

    const handleLikeClick = async (albumId: string) => {
        if (!user) {
            window.location.href = "/";
            return;
        }

        setIsLoadingLikes((prev) => ({ ...prev, [albumId]: true }));
        const currentLikedStatus = likes[albumId] || false;

        try {
            const method = currentLikedStatus ? "DELETE" : "POST";
            const response = await fetch("/api/like/album", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, albumId }),
            });

            if (!response.ok) throw new Error("Failed to update like");

            // Update UI optimistically
            setLikes((prev) => ({
                ...prev,
                [albumId]: !currentLikedStatus,
            }));

            // Update counts in albums
            const updateCount = (prev: Album[]) =>
                prev.map((a) =>
                    a.id === albumId
                        ? {
                              ...a,
                              like_count: currentLikedStatus
                                  ? a.like_count - 1
                                  : a.like_count + 1,
                          }
                        : a
                );

            setPopularAlbums(updateCount);
            setRecentlyLikedAlbums(updateCount);
            setRecentlyReviewedAlbums(updateCount);
            setSearchResults((prev) => updateCount(prev));
        } catch (error) {
            console.error("Like operation failed:", error);
        } finally {
            setIsLoadingLikes((prev) => ({ ...prev, [albumId]: false }));
        }
    };

    // Fetch initial albums
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                setLoadingPopular(true);
                setLoadingLiked(true);
                setLoadingReviewed(true);

                // Fetch popular albums
                const popularRes = await fetch("/api/albums/popular");
                const popularData = await popularRes.json();
                const transformedPopular = Array.isArray(popularData)
                    ? popularData.map(transformAlbum)
                    : [];
                setPopularAlbums(transformedPopular);
                setLoadingPopular(false);

                // Fetch recently liked albums
                const likedRes = await fetch("/api/albums/recently-liked");
                const likedData = await likedRes.json();
                const transformedLiked = Array.isArray(likedData)
                    ? likedData.map(transformAlbum)
                    : [];
                setRecentlyLikedAlbums(transformedLiked);
                setLoadingLiked(false);

                // Fetch recently reviewed albums
                const reviewedRes = await fetch("/api/albums/recently-reviewed");
                const reviewedData = await reviewedRes.json();
                const transformedReviewed = Array.isArray(reviewedData)
                    ? reviewedData.map(transformAlbum)
                    : [];
                setRecentlyReviewedAlbums(transformedReviewed);
                setLoadingReviewed(false);

                // Fetch likes for all
                const allIds = [
                    ...transformedPopular.map((a) => a.id),
                    ...transformedLiked.map((a) => a.id),
                    ...transformedReviewed.map((a) => a.id),
                ];
                fetchLikeStatuses(allIds);
            } catch (error) {
                console.error("Failed to fetch albums:", error);
                setLoadingPopular(false);
                setLoadingLiked(false);
                setLoadingReviewed(false);
            }
        };

        fetchAlbums();
    }, [fetchLikeStatuses]);

    useEffect(() => {
        if (showSearchResults && searchResults.length > 0 && user) {
            const searchIds = searchResults.map((a) => a.id);
            fetchLikeStatuses(searchIds);
        }
    }, [showSearchResults, searchResults, user, fetchLikeStatuses]);

    const searchAlbums = async (query: string) => {
        if (!query) {
            setSearchError(null);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const res = await fetch(
                `/api/albums/search?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) {
                throw new Error("Failed to search");
            }
            const data = await res.json();

            // Handle both array response and Spotify-style response
            let results = [];
            if (Array.isArray(data)) {
                results = data.filter(Boolean).map(transformAlbum);
            } else if (data.albums?.items) {
                results = data.albums.items
                    .filter(Boolean)
                    .map(transformAlbum);
            }

            console.log("Search results:", results);
            setSearchResults(results);
            setShowSearchResults(true);
        } catch (error) {
            console.error("Album search error:", error);
            setSearchError("Failed to search. Please try again.");
            setShowSearchResults(false);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBEb]">


            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Page Header with Search */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#5C5537]">
                                Albums
                            </h1>
                            <p className="text-[#5C5537]/70 mt-2">
                                Discover and explore music collections
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="w-full md:w-[320px]">
                            <div className="relative h-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search albums..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        searchAlbums(e.target.value);
                                    }}
                                    className="w-full h-full pl-10 pr-4 py-3 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5537]/30 text-[#5C5537] placeholder-[#5C5537]/50"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5C5537]"></div>
                                    </div>
                                )}
                                {searchTerm && !isSearching && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setShowSearchResults(false);
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50 hover:text-[#5C5537]">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {searchError && (
                                <p className="text-red-500 text-sm mt-1">
                                    {searchError}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {showSearchResults && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#5C5537]">
                                Search Results for{" "}
                                <span className="text-[#5C5537]">
                                    "{searchTerm}"
                                </span>
                            </h2>
                            <button
                                onClick={() => setShowSearchResults(false)}
                                className="text-sm text-[#5C5537]/70 hover:text-[#5C5537]">
                                Clear results
                            </button>
                        </div>
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {searchResults.map((album) => (
                                    <AlbumCard
                                        key={`search-${album.id}`}
                                        album={album}
                                        isLiked={likes[album.id] || false}
                                        isLoading={
                                            isLoadingLikes[album.id] || false
                                        }
                                        onLikeToggle={handleLikeClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#5C5537]/70">
                                {isSearching
                                    ? "Searching..."
                                    : "No albums found"}
                            </p>
                        )}
                    </div>
                )}

                {/* Popular Albums Section */}
                {!showSearchResults && (
                    <>
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    <span className="text-[#5C5537]">
                                        Popular
                                    </span>{" "}
                                    This Week
                                </h2>
                            </div>

                            {loadingPopular ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[...Array(3)].map((_, i) => (
                                        <SkeletonAlbumCard
                                            key={`skeleton-popular-${i}`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {popularAlbums.map((album) => (
                                        <AlbumCard
                                            key={`popular-${album.id}`}
                                            album={album}
                                            isLiked={
                                                likes[album.id] || false
                                            }
                                            isLoading={
                                                isLoadingLikes[album.id] ||
                                                false
                                            }
                                            onLikeToggle={handleLikeClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recently Liked Albums Section */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    Recently Liked Albums
                                </h2>
                            </div>

                            {loadingLiked ? (
                                <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden">
                                    {[...Array(3)].map((_, i) => (
                                        <SkeletonAlbumListItem
                                            key={`skeleton-liked-${i}`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden">
                                    {recentlyLikedAlbums.map(
                                        (album, index) => (
                                            <AlbumListItem
                                                key={`liked-${album.id}`}
                                                album={album}
                                                isLiked={
                                                    likes[album.id] || false
                                                }
                                                isLoading={
                                                    isLoadingLikes[
                                                        album.id
                                                    ] || false
                                                }
                                                onLikeToggle={handleLikeClick}
                                                isLastItem={
                                                    index ===
                                                    recentlyLikedAlbums.length -
                                                        1
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Recently Reviewed Albums Section */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    Recently Reviewed Albums
                                </h2>
                            </div>

                            {loadingReviewed ? (
                                <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden">
                                    {[...Array(3)].map((_, i) => (
                                        <SkeletonAlbumListItem
                                            key={`skeleton-reviewed-${i}`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden">
                                    {recentlyReviewedAlbums.map(
                                        (album, index) => (
                                            <AlbumListItem
                                                key={`reviewed-${album.id}`}
                                                album={album}
                                                isLiked={
                                                    likes[album.id] || false
                                                }
                                                isLoading={
                                                    isLoadingLikes[
                                                        album.id
                                                    ] || false
                                                }
                                                onLikeToggle={handleLikeClick}
                                                isLastItem={
                                                    index ===
                                                    recentlyReviewedAlbums.length -
                                                        1
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer variant="light" />
        </div>
    );
};

export default AlbumsPage;