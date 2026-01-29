"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import AnnotationForm from "@/components/log/forms/AnnotationForm";
import ReviewForm from "@/components/log/forms/ReviewForm";

import Filters from "@/components/songs/Filters";
import TrackCard from "@/components/songs/TrackCard";
import SpotifyTrackCard from "@/components/songs/SpotifyTrackCard";
import CompactTrackCard from "@/components/songs/CompactTrackCard";
import CompactAnnotationCard from "@/components/songs/CompactAnnotationCard";
import CompactReviewCard from "@/components/songs/CompactReviewCard";
import ReviewCard from "@/components/songs/ReviewCard";
import AnnotationCard from "@/components/songs/AnnotationCard";
import { spotifyToTrack, reviewToTrack } from "@/utils/trackConverters";

import {
    Track,
    SpotifyTrack,
    Review,
    Annotation,
    SpotifyPlaylistTrack,
} from "./types";

const Songs = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState("Most Rated");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("Genre");
    const [selectedMood, setSelectedMood] = useState("Mood");
    const [selectedYear, setSelectedYear] = useState("Year");
    const [selectedRating, setSelectedRating] = useState("Rating");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [globalTopTracks, setGlobalTopTracks] = useState<SpotifyTrack[]>([]);
    const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(true);
    const [topTracksError, setTopTracksError] = useState<string | null>(null);
    const [likes, setLikes] = useState<Record<string, boolean>>({});
    const [isLoadingLikes, setIsLoadingLikes] = useState<
        Record<string, boolean>
    >({});
    const [showAnnotationForm, setShowAnnotationForm] = useState(false);
    const [annotationTrack, setAnnotationTrack] = useState<Track | null>(null);
    const { user, loading: userLoading, error: userError } = useUser();

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewTrack, setReviewTrack] = useState<Track | null>(null);

    const [recentlyReviewedTracks, setRecentlyReviewedTracks] = useState<
        Review[]
    >([]);
    const [isLoadingRecentlyReviewed, setIsLoadingRecentlyReviewed] =
        useState(false);
    const [recentlyReviewedError, setRecentlyReviewedError] = useState<
        string | null
    >(null);

    const [popularReviews, setPopularReviews] = useState<Review[]>([]);
    const [isLoadingPopularReviews, setIsLoadingPopularReviews] =
        useState(false);
    const [popularReviewsError, setPopularReviewsError] = useState<
        string | null
    >(null);

    const [popularAnnotations, setPopularAnnotations] = useState<Annotation[]>(
        []
    );
    const [isLoadingPopularAnnotations, setIsLoadingPopularAnnotations] =
        useState(false);
    const [popularAnnotationsError, setPopularAnnotationsError] = useState<
        string | null
    >(null);

    const [recentlyAnnotatedTracks, setRecentlyAnnotatedTracks] = useState<
        Annotation[]
    >([]);
    const [isLoadingRecentlyAnnotated, setIsLoadingRecentlyAnnotated] =
        useState(false);
    const [recentlyAnnotatedError, setRecentlyAnnotatedError] = useState<
        string | null
    >(null);

    const fetchRecentlyAnnotatedTracks = async () => {
        setIsLoadingRecentlyAnnotated(true);
        setRecentlyAnnotatedError(null);

        try {
            const res = await fetch("/api/annotate/last-annotated-tracks");
            if (!res.ok) {
                throw new Error("Failed to fetch recently annotated tracks");
            }
            const data = await res.json();
            setRecentlyAnnotatedTracks(data);
        } catch (error) {
            console.error("Error fetching recently annotated tracks:", error);
            setRecentlyAnnotatedError(
                "Failed to load recently annotated tracks"
            );
        } finally {
            setIsLoadingRecentlyAnnotated(false);
        }
    };

    useEffect(() => {
        fetchRecentlyAnnotatedTracks();
    }, []);

    const fetchPopularAnnotations = async () => {
        setIsLoadingPopularAnnotations(true);
        setPopularAnnotationsError(null);

        try {
            const res = await fetch("/api/annotate/popular-this-week");
            if (!res.ok) {
                throw new Error("Failed to fetch popular annotations");
            }
            const data = await res.json();
            setPopularAnnotations(data);
        } catch (error) {
            console.error("Error fetching popular annotations:", error);
            setPopularAnnotationsError("Failed to load popular annotations");
        } finally {
            setIsLoadingPopularAnnotations(false);
        }
    };

    useEffect(() => {
        if (!showSearchResults) {
            fetchPopularAnnotations();
        }
    }, [showSearchResults]);

    const fetchPopularReviews = async () => {
        setIsLoadingPopularReviews(true);
        setPopularReviewsError(null);

        try {
            const res = await fetch("/api/review/popular-this-week");
            if (!res.ok) {
                throw new Error("Failed to fetch popular reviews");
            }
            const data = await res.json();
            setPopularReviews(data);
        } catch (error) {
            console.error("Error fetching popular reviews:", error);
            setPopularReviewsError("Failed to load popular reviews");
        } finally {
            setIsLoadingPopularReviews(false);
        }
    };

    useEffect(() => {
        if (!showSearchResults) {
            fetchPopularReviews();
        }
    }, [showSearchResults]);

    const fetchRecentlyReviewedTracks = async () => {
        setIsLoadingRecentlyReviewed(true);
        setRecentlyReviewedError(null);

        try {
            const res = await fetch("/api/review/last-reviewed-tracks");
            if (!res.ok) {
                throw new Error("Failed to fetch recently reviewed tracks");
            }
            const data = await res.json();
            setRecentlyReviewedTracks(data);
        } catch (error) {
            console.error("Error fetching recently reviewed tracks:", error);
            setRecentlyReviewedError("Failed to load recently reviewed tracks");
        } finally {
            setIsLoadingRecentlyReviewed(false);
        }
    };

    useEffect(() => {
        fetchRecentlyReviewedTracks();
    }, []);

    const handleLikeClick = async (trackId: string) => {
        if (!user) {
            window.location.href = "/";
            return;
        }

        setIsLoadingLikes((prev) => ({ ...prev, [trackId]: true }));

        try {
            const currentLikedStatus = likes[trackId] || false;
            const method = currentLikedStatus ? "DELETE" : "POST";
            const endpoint = `/api/like/track`;

            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, trackId }),
            });

            if (!response.ok) {
                throw new Error("Failed to update like status");
            }

            setLikes((prev) => ({ ...prev, [trackId]: !currentLikedStatus }));
        } catch (error) {
            console.error("Like operation failed:", error);
        } finally {
            setIsLoadingLikes((prev) => ({ ...prev, [trackId]: false }));
        }
    };

    const trendingTracks =
        globalTopTracks.length > 0
            ? globalTopTracks.map((trackData: SpotifyTrack) =>
                spotifyToTrack(trackData)
            )
            : [];

    const recentlyAnnotated =
        globalTopTracks.length > 0
            ? globalTopTracks.slice(2, 6).map(spotifyToTrack)
            : [];

    const fetchLikeStatuses = useCallback(
        async (trackIds: string[]) => {
            if (!user) return;

            try {
                const likeStatuses = await Promise.all(
                    trackIds.map((trackId) =>
                        fetch(
                            `/api/like/track?userId=${user.id}&trackId=${trackId}`
                        )
                            .then((res) => res.json())
                            .then((data) => ({
                                trackId,
                                isLiked: data.isLiked,
                            }))
                            .catch(() => ({ trackId, isLiked: false }))
                    )
                );

                setLikes((prev) => {
                    const newLikes = { ...prev };
                    likeStatuses.forEach(({ trackId, isLiked }) => {
                        newLikes[trackId] = isLiked;
                    });
                    return newLikes;
                });
            } catch (error) {
                console.error("Failed to fetch like statuses:", error);
            }
        },
        [user]
    );

    useEffect(() => {
        const fetchGlobalTopTracks = async () => {
            try {
                setIsLoadingTopTracks(true);
                const res = await fetch("/api/songs/global-top-4");
                if (!res.ok) {
                    throw new Error("Failed to fetch global top tracks");
                }
                const data = (await res.json()) as SpotifyPlaylistTrack[];
                const tracks = data.map(item => item.track);
                setGlobalTopTracks(tracks);

                if (user && tracks.length > 0) {
                    const trackIds = tracks
                        .map((track) => track.id)
                        .filter(Boolean);
                    fetchLikeStatuses(trackIds);
                }
            } catch (error) {
                console.error("Error fetching global top tracks:", error);
                setTopTracksError("Failed to load global top tracks");
            } finally {
                setIsLoadingTopTracks(false);
            }
        };

        fetchGlobalTopTracks();
    }, []);

    useEffect(() => {
        if (user && globalTopTracks.length > 0) {
            const trackIds = globalTopTracks
                .map((track) => track.id)
                .filter(Boolean);
            fetchLikeStatuses(trackIds);
        }
    }, [globalTopTracks, user, fetchLikeStatuses]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative">
                        <div className="w-4 h-4 mb-2 text-[#5C5537]/30">★</div>
                        <div
                            className="absolute top-0 left-0 w-5 h-5 text-[#FFBA00] overflow-hidden"
                            style={{
                                width: `${Math.max(0, Math.min(1, rating - star + 1)) * 100}%`,
                            }}>
                            ★
                        </div>
                    </div>
                ))}
                <span className="text-sm text-[#5C5537] ml-1">{rating}</span>
            </div>
        );
    };

    const searchSpotify = async (query: string) => {
        if (!query) {
            setSearchError(null);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const res = await fetch(
                `/api/songs/search?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || "Failed to search");
            }

            const data = await res.json();
            const items = Array.isArray(data) ? data : data?.tracks?.items || [];
            setSearchResults(items);
            setShowSearchResults(true);

            if (user && searchResults.length > 0) {
                const trackIds = searchResults.map(track => track.id);
                fetchLikeStatuses(trackIds);
            }
        } catch (error) {
            console.error("Spotify search error:", error);
            setSearchError(error instanceof Error ? error.message : "Failed to search. Please try again.");
            setShowSearchResults(false);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBEb]">


            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Search and Filters */}
                <Filters
                    selectedGenre={selectedGenre}
                    setSelectedGenre={setSelectedGenre}
                    selectedMood={selectedMood}
                    setSelectedMood={setSelectedMood}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedRating={selectedRating}
                    setSelectedRating={setSelectedRating}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                {searchResults.map((track) => (
                                    <SpotifyTrackCard
                                        key={`spotify-${track.id}`}
                                        track={track}
                                        isLiked={likes[track.id] || false}
                                        isLoading={
                                            isLoadingLikes[track.id] || false
                                        }
                                        onLikeClick={handleLikeClick}
                                        onReviewClick={(track) => {
                                            setReviewTrack(
                                                spotifyToTrack(track)
                                            );
                                            setShowReviewForm(true);
                                        }}
                                        onAnnotationClick={(track) => {
                                            setAnnotationTrack(
                                                spotifyToTrack(track)
                                            );
                                            setShowAnnotationForm(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#5C5537]/70">No results found</p>
                        )}
                    </div>
                )}

                {/* Trending This Week - 4 songs only */}
                {!showSearchResults && (
                    <>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#5C5537] mb-6">
                                <span className="text-[#5C5537]">Trending</span>{" "}
                                This Week
                            </h2>
                            {isLoadingTopTracks ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
                                </div>
                            ) : topTracksError ? (
                                <p className="text-[#5C5537]">{topTracksError}</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    {trendingTracks.map((track) => (
                                        <TrackCard
                                            key={`trending-${track.id}`}
                                            track={track}
                                            viewMode={viewMode}
                                            isLiked={likes[track.id] || false}
                                            isLoading={
                                                isLoadingLikes[track.id] ||
                                                false
                                            }
                                            onLikeClick={handleLikeClick}
                                            onReviewClick={(track) => {
                                                setReviewTrack(track);
                                                setShowReviewForm(true);
                                            }}
                                            onAnnotationClick={(track) => {
                                                setAnnotationTrack(track);
                                                setShowAnnotationForm(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recently Reviewed & Annotated - Side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Recently Reviewed */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#5C5537]">
                                        Recently Reviewed
                                    </h2>
                                </div>
                                {recentlyReviewedTracks.map((review) => (
                                    <CompactReviewCard
                                        key={`reviewed-${review.id}`}
                                        review={review}
                                    />
                                ))}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#5C5537]">
                                        Recently Annotated
                                    </h2>
                                </div>
                                {isLoadingRecentlyAnnotated ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]"></div>
                                    </div>
                                ) : recentlyAnnotatedError ? (
                                    <p className="text-[#5C5537]">
                                        {recentlyAnnotatedError}
                                    </p>
                                ) : recentlyAnnotatedTracks.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentlyAnnotatedTracks.map(
                                            (annotation) => (
                                                <CompactAnnotationCard
                                                    key={`annotated-${annotation.id}`}
                                                    annotation={annotation}
                                                />
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[#5C5537]/70">
                                        No recently annotated tracks
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Popular Reviews This Week */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    Popular Reviews This Week
                                </h2>
                            </div>

                            {isLoadingPopularReviews ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]"></div>
                                </div>
                            ) : popularReviewsError ? (
                                <p className="text-[#5C5537]">
                                    {popularReviewsError}
                                </p>
                            ) : popularReviews.length > 0 ? (
                                <div className="space-y-4">
                                    {popularReviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[#5C5537]/70">
                                    No popular reviews yet
                                </p>
                            )}
                        </div>

                        {/* Popular Annotations This Week */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    Popular Annotations This Week
                                </h2>
                            </div>

                            {isLoadingPopularAnnotations ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C5537]"></div>
                                </div>
                            ) : popularAnnotationsError ? (
                                <p className="text-[#5C5537]">
                                    {popularAnnotationsError}
                                </p>
                            ) : popularAnnotations.length > 0 ? (
                                <div className="space-y-4">
                                    {popularAnnotations.map((annotation) => (
                                        <AnnotationCard
                                            key={annotation.id}
                                            annotation={annotation}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[#5C5537]/70">
                                    No popular annotations yet
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Review Form Popup - Moved outside conditional blocks */}
                {showReviewForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Darkened background overlay */}
                        <div
                            className="absolute inset-0 bg-[#5C5537]/20"
                            onClick={() =>
                                setShowReviewForm(false)
                            }></div>

                        {/* Popup container */}
                        <div className="bg-[#FFFBEb] rounded-lg p-6 w-full max-w-2xl border border-[#5C5537]/20 shadow-lg relative z-10">
                            {/* Review Form */}
                            <ReviewForm
                                onClose={() => {
                                    setShowReviewForm(false);
                                    setReviewTrack(null);
                                }}
                                initialTrack={
                                    reviewTrack
                                        ? {
                                            id: reviewTrack.id,
                                            name: reviewTrack.title,
                                            artist: reviewTrack.artist,
                                            album: reviewTrack.album,
                                            coverArt: reviewTrack.coverArt,
                                        }
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                )}

                {/* Annotation Form Popup - Moved outside conditional blocks */}
                {showAnnotationForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Darkened background overlay */}
                        <div
                            className="absolute inset-0 bg-[#5C5537]/20"
                            onClick={() =>
                                setShowAnnotationForm(false)
                            }></div>

                        {/* Popup container */}
                        <div className="bg-[#FFFBEb] rounded-lg p-6 w-full max-w-2xl border border-[#5C5537]/20 shadow-lg relative z-10">
                            {/* Annotation Form */}
                            <AnnotationForm
                                onClose={() => {
                                    setShowAnnotationForm(false);
                                    setAnnotationTrack(null);
                                }}
                                initialTrack={
                                    annotationTrack
                                        ? {
                                            id: annotationTrack.id,
                                            name: annotationTrack.title,
                                            artist: annotationTrack.artist,
                                            album: annotationTrack.album,
                                            coverArt: annotationTrack.coverArt,
                                        }
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                )}
            </div>
            <Footer variant="light" />
        </div>
    );
};

export default Songs;