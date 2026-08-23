"use client";

import React, { useState, useEffect } from "react";
import { Heart, Star, MessageCircle, Bookmark } from "lucide-react";
import { useParams } from "next/navigation"; // Add this import
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import useUser from "@/hooks/useUser";
import ReviewForm from "@/components/log/forms/ReviewForm";
import AnnotationForm from "@/components/log/forms/AnnotationForm";
import { spotifyToTrack } from "@/utils/trackConverters";
import MediaCard from "@/components/MediaCard";
import { SITE_URL } from '@/lib/site';

interface Review {
    id: string;
    rating: number;
    text: string;
    created_at: string;
    like_count: number;
    is_public: boolean;
    users: {
        id: string;
        name: string;
        image_url: string;
    };
}

interface Annotation {
    id: string;
    timestamp: number; // This is a float representing seconds
    text: string; // The annotation content
    created_at: string;
    like_count: number;
    is_public: boolean;
    users: {
        id: string;
        name: string;
        image_url: string;
    };
}

interface SpotifyTrack {
    id: string;
    name: string;
    preview_url: string | null;
    album: {
        name: string;
        images: { url: string }[];
        release_date: string;
    };
    artists: { name: string }[];
    duration_ms: number;
    popularity: number;
    external_urls: {
        spotify: string;
    };
    stats?: {
        like_count: number;
        review_count: number;
        annotation_count: number;
        avg_rating: number;
    };
}

const SongDetailClient = ({
    params,
    initialTrack,
    initialReviews,
    initialAnnotations,
}: {
    params: { song_id: string },
    initialTrack: SpotifyTrack | null,
    initialReviews?: Review[],
    initialAnnotations?: Annotation[],
}) => {
    const [track, setTrack] = useState<SpotifyTrack | null>(initialTrack);
    const [loading, setLoading] = useState(!initialTrack);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"reviews" | "annotations">(
        "reviews"
    );
    const [ratingDistribution, setRatingDistribution] = useState([
        0, 0, 0, 0, 0,
    ]);

    const [reviews, setReviews] = useState<Review[]>(initialReviews ?? []);
    const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations ?? []);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [loadingAnnotations, setLoadingAnnotations] = useState(false);
    const [reviewsError, setReviewsError] = useState<string | null>(null);
    const [annotationsError, setAnnotationsError] = useState<string | null>(
        null
    );

    const { user } = useUser();
    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showAnnotationForm, setShowAnnotationForm] = useState(false);
    const [similarTracks, setSimilarTracks] = useState<any[]>([]);

    useEffect(() => {
        if (!params.song_id) return;
        fetch(`/api/tracks/similar?id=${params.song_id}`)
            .then((r) => r.json())
            .then((data) => setSimilarTracks(data || []))
            .catch(console.error);
    }, [params.song_id]);

    const [reviewLikes, setReviewLikes] = useState<Record<string, boolean>>({});
    const [reviewLikeCounts, setReviewLikeCounts] = useState<
        Record<string, number>
    >({});
    const [reviewLoading, setReviewLoading] = useState<Record<string, boolean>>(
        {}
    );

    // State for annotation likes
    const [annotationLikes, setAnnotationLikes] = useState<
        Record<string, boolean>
    >({});
    const [annotationLikeCounts, setAnnotationLikeCounts] = useState<
        Record<string, number>
    >({});
    const [annotationLoading, setAnnotationLoading] = useState<
        Record<string, boolean>
    >({});

    // Fetch like status for reviews
    useEffect(() => {
        if (!user || reviews.length === 0) return;

        const fetchReviewLikes = async () => {
            const newLikes: Record<string, boolean> = {};
            const newCounts: Record<string, number> = {};

            for (const review of reviews) {
                try {
                    const res = await fetch(
                        `/api/likes/review?userId=${user.id}&reviewId=${review.id}`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        newLikes[review.id] = data.isLiked;
                        newCounts[review.id] = review.like_count;
                    }
                } catch (error) {
                    console.error("Failed to fetch review like status", error);
                    newLikes[review.id] = false;
                    newCounts[review.id] = review.like_count;
                }
            }

            setReviewLikes(newLikes);
            setReviewLikeCounts(newCounts);
        };

        fetchReviewLikes();
    }, [user, reviews]);

    // Fetch like status for annotations
    useEffect(() => {
        if (!user || annotations.length === 0) return;

        const fetchAnnotationLikes = async () => {
            const newLikes: Record<string, boolean> = {};
            const newCounts: Record<string, number> = {};

            for (const annotation of annotations) {
                try {
                    const res = await fetch(
                        `/api/likes/annotation?userId=${user.id}&annotationId=${annotation.id}`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        newLikes[annotation.id] = data.isLiked;
                        newCounts[annotation.id] = annotation.like_count;
                    }
                } catch (error) {
                    console.error(
                        "Failed to fetch annotation like status",
                        error
                    );
                    newLikes[annotation.id] = false;
                    newCounts[annotation.id] = annotation.like_count;
                }
            }

            setAnnotationLikes(newLikes);
            setAnnotationLikeCounts(newCounts);
        };

        fetchAnnotationLikes();
    }, [user, annotations]);

    const handleReviewLikeClick = async (reviewId: string) => {
        if (!user || reviewLoading[reviewId]) return;

        setReviewLoading((prev) => ({ ...prev, [reviewId]: true }));
        const newIsLiked = !reviewLikes[reviewId];
        const newCount = newIsLiked
            ? (reviewLikeCounts[reviewId] || 0) + 1
            : Math.max(0, (reviewLikeCounts[reviewId] || 0) - 1);

        // Optimistic update
        setReviewLikes((prev) => ({ ...prev, [reviewId]: newIsLiked }));
        setReviewLikeCounts((prev) => ({ ...prev, [reviewId]: newCount }));

        try {
            const response = await fetch("/api/likes/review", {
                method: newIsLiked ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    reviewId: reviewId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update review like");
            }
        } catch (error) {
            console.error("Review like operation failed:", error);
            // Revert optimistic update
            setReviewLikes((prev) => ({ ...prev, [reviewId]: !newIsLiked }));
            setReviewLikeCounts((prev) => ({
                ...prev,
                [reviewId]: reviewLikeCounts[reviewId],
            }));
        } finally {
            setReviewLoading((prev) => ({ ...prev, [reviewId]: false }));
        }
    };

    // Handle annotation like click
    const handleAnnotationLikeClick = async (annotationId: string) => {
        if (!user || annotationLoading[annotationId]) return;

        setAnnotationLoading((prev) => ({ ...prev, [annotationId]: true }));
        const newIsLiked = !annotationLikes[annotationId];
        const newCount = newIsLiked
            ? (annotationLikeCounts[annotationId] || 0) + 1
            : Math.max(0, (annotationLikeCounts[annotationId] || 0) - 1);

        // Optimistic update
        setAnnotationLikes((prev) => ({ ...prev, [annotationId]: newIsLiked }));
        setAnnotationLikeCounts((prev) => ({
            ...prev,
            [annotationId]: newCount,
        }));

        try {
            const response = await fetch("/api/likes/annotation", {
                method: newIsLiked ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    annotationId: annotationId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update annotation like");
            }
        } catch (error) {
            console.error("Annotation like operation failed:", error);
            // Revert optimistic update
            setAnnotationLikes((prev) => ({
                ...prev,
                [annotationId]: !newIsLiked,
            }));
            setAnnotationLikeCounts((prev) => ({
                ...prev,
                [annotationId]: annotationLikeCounts[annotationId],
            }));
        } finally {
            setAnnotationLoading((prev) => ({
                ...prev,
                [annotationId]: false,
            }));
        }
    };

    // Fetch like status
    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!user || !track) return;

            try {
                const res = await fetch(
                    `/api/likes/track?userId=${user.id}&trackId=${track.id}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setIsLiked(data.isLiked);
                }
            } catch (error) {
                console.error("Failed to fetch like status", error);
            }
        };

        fetchLikeStatus();
    }, [user, track]);

    // Handle like click
    const handleLikeClick = async () => {
        if (!user) {
            window.location.href = "/";
            return;
        }

        if (!track) return;

        setLikeLoading(true);
        const newIsLiked = !isLiked;

        try {
            const method = newIsLiked ? "POST" : "DELETE";
            const res = await fetch("/api/likes/track", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, trackId: track.id }),
            });

            if (res.ok) {
                setIsLiked(newIsLiked);
                // Update track stats - fixed type handling
                setTrack((prev) => {
                    if (!prev) return null;

                    // Create a safe stats object with defaults
                    const currentStats = prev.stats
                        ? { ...prev.stats }
                        : {
                              like_count: 0,
                              review_count: 0,
                              annotation_count: 0,
                              avg_rating: 0,
                          };

                    const newStats = {
                        ...currentStats,
                        like_count:
                            currentStats.like_count + (newIsLiked ? 1 : -1),
                    };

                    return {
                        ...prev,
                        stats: newStats,
                    };
                });
            }
        } catch (error) {
            console.error("Like operation failed:", error);
        } finally {
            setLikeLoading(false);
        }
    };

    // Fetch reviews for the track
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoadingReviews(true);
                setReviewsError(null);

                const res = await fetch(`/api/reviews/${params.song_id}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch reviews");
                }

                const data = await res.json();
                console.log("Fetched reviews:", data);
                setReviews(data);
            } catch (error) {
                console.error("Error fetching reviews:", error);
                setReviewsError("Failed to load reviews");
            } finally {
                setLoadingReviews(false);
            }
        };

        if (track) {
            fetchReviews();
        }
    }, [params.song_id, track]);

    // Fetch annotations for the track
    useEffect(() => {
        const fetchAnnotations = async () => {
            try {
                setLoadingAnnotations(true);
                setAnnotationsError(null);

                const res = await fetch(`/api/annotations/${params.song_id}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch annotations");
                }

                const data = await res.json();
                console.log("Fetched annotations:", data);
                setAnnotations(data);
            } catch (error) {
                console.error("Error fetching annotations:", error);
                setAnnotationsError("Failed to load annotations");
            } finally {
                setLoadingAnnotations(false);
            }
        };

        if (track) {
            fetchAnnotations();
        }
    }, [params.song_id, track]);

    useEffect(() => {
        const fetchRatingDistribution = async () => {
            try {
                const res = await fetch(
                    `/api/reviews/distribution/${params.song_id}`
                );
                if (res.ok) {
                    const data = await res.json();
                    // Convert to array format [1-star%, 2-star%, ...]
                    setRatingDistribution([
                        data.percentages[1],
                        data.percentages[2],
                        data.percentages[3],
                        data.percentages[4],
                        data.percentages[5],
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch rating distribution:", error);
            }
        };

        fetchRatingDistribution();
    }, []);

    const trackStats = {
        likes: track?.stats?.like_count || 0,
        reviews: track?.stats?.review_count || 0,
        annotations: track?.stats?.annotation_count || 0,
        avgRating: track?.stats?.avg_rating || 0,
        // Default rating distribution (you might want to fetch this separately)
        ratingDistribution: [5, 15, 20, 40, 20],
    };

    useEffect(() => {
        const fetchTrackDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/tracks/${params.song_id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch track details");
                }

                const data = await response.json();
                setTrack(data);
            } catch (err) {
                setError((err as Error).message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        if (!initialTrack) {
            fetchTrackDetails();
        }
    }, [params.song_id]);

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0).padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative">
                        <div className="w-4 h-4 mb-2 text-[#5C5537]/30">★</div>
                        <div
                            className="absolute top-0 left-0 w-5 h-5 text-[#FFBA00] overflow-hidden"
                            style={{
                                width: `${
                                    Math.max(
                                        0,
                                        Math.min(1, rating - star + 1)
                                    ) * 100
                                }%`,
                            }}>
                            ★
                        </div>
                    </div>
                ))}
                <span className="text-sm text-[#5C5537] ml-1">
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBEb]">

                <div className="max-w-5xl mx-auto px-4 py-8 flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
                </div>
                <Footer variant="light" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FFFBEb]">

                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <p className="text-red-500">{error}</p>
                </div>
                <Footer variant="light" />
            </div>
        );
    }

    if (!track) {
        return (
            <div className="min-h-screen bg-[#FFFBEb]">

                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <p className="text-[#5C5537]">Track not found</p>
                </div>
                <Footer variant="light" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBEb]">


            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Compact Track Header */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="w-full md:w-1/3 flex justify-center">
                        <div className="w-56 h-56 relative overflow-hidden rounded-xl shadow border border-[#5C5537]/20">
                            <img
                                src={
                                    track.album.images[0]?.url ||
                                    "/default-album.png"
                                }
                                alt={`${track.name} cover`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/default-album.png";
                                }}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-2/3">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#5C5537] mb-1">
                            {track.name}
                        </h1>
                        <p className="text-lg text-[#5C5537]/70 mb-4">
                            {track.artists.map((a) => a.name).join(", ")}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div>
                                <p className="text-xs text-[#5C5537]/70">Album</p>
                                <p className="text-sm font-medium text-[#5C5537]">
                                    {track.album.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#5C5537]/70">
                                    Release Date
                                </p>
                                <p className="text-sm font-medium text-[#5C5537]">
                                    {track.album.release_date
                                        ? new Date(
                                              track.album.release_date
                                          ).toLocaleDateString()
                                        : "Unknown"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[#5C5537]/70">
                                    Duration
                                </p>
                                <p className="text-sm font-medium text-[#5C5537]">
                                    {formatDuration(track.duration_ms)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleLikeClick}
                                disabled={likeLoading}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                                    isLiked
                                        ? "bg-[#5C5537] text-[#FFFBEb] border border-[#5C5537]"
                                        : "bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/30 hover:bg-[#5C5537]/10 hover:border-[#5C5537]/50"
                                }`}>
                                {likeLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5C5537]"></div>
                                ) : (
                                    <>
                                        <Heart className="w-3 h-3" />
                                        <span>
                                            {isLiked ? "Liked" : "Like"}
                                        </span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => track && setShowReviewForm(true)}
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/30 hover:bg-[#5C5537]/10 hover:border-[#5C5537]/50 cursor-pointer">
                                <span>Review</span>
                            </button>

                            <button
                                onClick={() =>
                                    track && setShowAnnotationForm(true)
                                }
                                className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs bg-[#FFFBEb] text-[#5C5537] border border-[#5C5537]/30 hover:bg-[#5C5537]/10 hover:border-[#5C5537]/50 cursor-pointer">
                                <span>Annotate</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="grid grid-cols-4 gap-2 border-y border-[#5C5537]/20 py-5">
                        <div className="text-center">
                            <div className="text-xl font-bold text-[#5C5537]">
                                {trackStats.likes}
                            </div>
                            <div className="text-xs text-[#5C5537]/70 flex items-center justify-center">
                                <Heart className="w-3 h-3 mr-1" /> Likes
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-[#5C5537]">
                                {trackStats.reviews}
                            </div>
                            <div className="text-xs text-[#5C5537]/70 flex items-center justify-center">
                                <Star className="w-3 h-3 mr-1" /> Reviews
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-[#5C5537]">
                                {trackStats.annotations}
                            </div>
                            <div className="text-xs text-[#5C5537]/70 flex items-center justify-center">
                                <MessageCircle className="w-3 h-3 mr-1" />{" "}
                                Annotations
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-[#5C5537]">
                                {trackStats.avgRating.toFixed(1)}
                            </div>
                            <div className="text-xs text-[#5C5537]/70">
                                Avg Rating
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Rating Distribution */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-[#5C5537] mb-3">
                        Rating Distribution
                    </h2>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((stars, index) => (
                            <div key={stars} className="flex items-center">
                                <div className="w-12 text-sm text-[#5C5537]">{stars}★</div>
                                <div className="flex-1 ml-2">
                                    <div className="w-full bg-[#5C5537]/20 rounded-full h-2">
                                        <div
                                            className="bg-[#5C5537] h-2 rounded-full"
                                            style={{
                                                width: `${
                                                    ratingDistribution[
                                                        stars - 1
                                                    ]
                                                }%`,
                                            }}></div>
                                    </div>
                                </div>
                                <div className="w-10 text-right text-xs text-[#5C5537]/70">
                                    {ratingDistribution[stars - 1]}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reviews & Annotations Tabs */}
                <div className="mb-6">
                    <div className="flex border-b border-[#5C5537]/20">
                        <button
                            className={`py-2 px-4 text-sm font-medium ${
                                activeTab === "reviews"
                                    ? "text-[#5C5537] border-b-2 border-[#5C5537]"
                                    : "text-[#5C5537]/70"
                            } cursor-pointer`}
                            onClick={() => setActiveTab("reviews")}>
                            Reviews ({reviews.length})
                        </button>
                        <button
                            className={`py-2 px-4 text-sm font-medium ${
                                activeTab === "annotations"
                                    ? "text-[#5C5537] border-b-2 border-[#5C5537]"
                                    : "text-[#5C5537]/70"
                            } cursor-pointer`}
                            onClick={() => setActiveTab("annotations")}>
                            Annotations ({annotations.length})
                        </button>
                    </div>

                    {activeTab === "reviews" && (
                        <div className="mt-4 space-y-4">
                            {reviews.map((review) => (
                                <article
                                    key={review.id}
                                    itemScope
                                    itemType="https://schema.org/Review"
                                    className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl p-4"
                                >
                                    <header className="flex justify-between items-start min-h-[3.5rem]">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={review.users.image_url || "/default-avatar.jpg"}
                                                alt={review.users.name}
                                                className="w-10 h-10 rounded-full mt-0.5"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/default-avatar.jpg";
                                                }}
                                            />
                                            <div>
                                                <span itemProp="author" itemScope itemType="https://schema.org/Person">
                                                    <span itemProp="name" className="font-medium text-sm text-[#5C5537]">
                                                        {review.users.name}
                                                    </span>
                                                </span>
                                                <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                                                    <meta itemProp="ratingValue" content={String(review.rating)} />
                                                    <meta itemProp="bestRating" content="5" />
                                                    <div className="mt-1">{renderStars(review.rating)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleReviewLikeClick(review.id)}
                                            disabled={reviewLoading[review.id]}
                                            className="group flex items-center space-x-1 focus:outline-none cursor-pointer"
                                        >
                                            <Heart
                                                className={`w-4 h-4 transition-all duration-200 ${
                                                    reviewLikes[review.id]
                                                        ? "text-[#5C5537] fill-[#5C5537]"
                                                        : "text-[#5C5537]/50 group-hover:text-[#5C5537]"
                                                }`}
                                            />
                                            <span
                                                className={`text-sm transition-colors duration-200 ${
                                                    reviewLikes[review.id]
                                                        ? "text-[#5C5537] font-medium"
                                                        : "text-[#5C5537]/70 group-hover:text-[#5C5537]"
                                                }`}
                                            >
                                                {reviewLikeCounts[review.id] ?? review.like_count}
                                            </span>
                                        </button>
                                    </header>
                                    <p itemProp="reviewBody" className="text-sm text-[#5C5537] mb-3 line-clamp-2">
                                        {review.text}
                                    </p>
                                    <footer className="flex justify-between items-center text-xs">
                                        <time dateTime={review.created_at} className="text-[#5C5537]/70">
                                            {formatDate(review.created_at)}
                                        </time>
                                    </footer>
                                </article>
                            ))}
                        </div>
                    )}

                    {activeTab === "annotations" && (
                        <div className="mt-4 space-y-4">
                            {annotations.map((annotation) => {
                                const minutes = Math.floor(annotation.timestamp / 60);
                                const seconds = Math.floor(annotation.timestamp % 60);
                                const timestampStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

                                return (
                                    <article
                                        key={annotation.id}
                                        itemScope
                                        itemType="https://schema.org/Comment"
                                        className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl p-4"
                                    >
                                        {/* Timestamp reference — keeps lyric position and annotation body together for LLM crawlers */}
                                        <blockquote
                                            itemProp="about"
                                            cite={`${SITE_URL}/songs/${params.song_id}`}
                                            className="border-l-2 border-[#5C5537]/30 pl-3 mb-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={annotation.users.image_url || "/default-avatar.jpg"}
                                                    alt={annotation.users.name}
                                                    className="w-8 h-8 rounded-full"
                                                    onError={(e) => { e.currentTarget.src = "/default-avatar.jpg"; }}
                                                />
                                                <span itemProp="author" itemScope itemType="https://schema.org/Person">
                                                    <a
                                                        itemProp="url"
                                                        href={`/profile/${encodeURIComponent(annotation.users.name)}`}
                                                        className="font-medium text-sm text-[#5C5537] hover:underline"
                                                    >
                                                        <span itemProp="name">{annotation.users.name}</span>
                                                    </a>
                                                </span>
                                                <time
                                                    dateTime={`PT${Math.floor(annotation.timestamp)}S`}
                                                    className="text-xs text-[#5C5537]/70"
                                                >
                                                    at {timestampStr}
                                                </time>
                                            </div>
                                        </blockquote>

                                        <aside itemProp="text">
                                            <p className="text-sm text-[#5C5537] mb-3">
                                                {annotation.text}
                                            </p>
                                        </aside>

                                        <footer className="flex justify-between items-center text-xs">
                                            <time dateTime={annotation.created_at} className="text-[#5C5537]/70">
                                                {formatDate(annotation.created_at)}
                                            </time>
                                            <button
                                                onClick={() => handleAnnotationLikeClick(annotation.id)}
                                                disabled={annotationLoading[annotation.id]}
                                                className="group flex items-center space-x-1 focus:outline-none cursor-pointer"
                                            >
                                                <Heart
                                                    className={`w-4 h-4 transition-all duration-200 ${
                                                        annotationLikes[annotation.id]
                                                            ? "text-[#5C5537] fill-[#5C5537]"
                                                            : "text-[#5C5537]/50 group-hover:text-[#5C5537]"
                                                    }`}
                                                />
                                                <span
                                                    className={`text-sm transition-colors duration-200 ${
                                                        annotationLikes[annotation.id]
                                                            ? "text-[#5C5537] font-medium"
                                                            : "text-[#5C5537]/70 group-hover:text-[#5C5537]"
                                                    }`}
                                                >
                                                    {annotationLikeCounts[annotation.id] ?? annotation.like_count}
                                                </span>
                                            </button>
                                        </footer>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {showReviewForm && track && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div
                                className="absolute inset-0 bg-[#5C5537]/20"
                                onClick={() => setShowReviewForm(false)}></div>
                            <div className="bg-[#FFFBEb] rounded-lg p-6 w-full max-w-2xl border border-[#5C5537]/20 shadow-lg relative z-10">
                                <ReviewForm
                                    onClose={() => setShowReviewForm(false)}
                                    initialTrack={{
                                        id: track.id,
                                        name: track.name,
                                        artist: track.artists
                                            .map((a) => a.name)
                                            .join(", "),
                                        album: track.album.name,
                                        coverArt: track.album.images[0]?.url,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {showAnnotationForm && track && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div
                                className="absolute inset-0 bg-[#5C5537]/20"
                                onClick={() =>
                                    setShowAnnotationForm(false)
                                }></div>
                            <div className="bg-[#FFFBEb] rounded-lg p-6 w-full max-w-2xl border border-[#5C5537]/20 shadow-lg relative z-10">
                                <AnnotationForm
                                    onClose={() => setShowAnnotationForm(false)}
                                    initialTrack={{
                                        id: track.id,
                                        name: track.name,
                                        artist: track.artists
                                            .map((a) => a.name)
                                            .join(", "),
                                        album: track.album.name,
                                        coverArt: track.album.images[0]?.url,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Similar Tracks */}
            {similarTracks.length > 0 && (
                <div className="max-w-5xl mx-auto px-4 pb-8">
                    <h2 className="text-xl font-bold text-[#5C5537] mb-4">
                        Similar Tracks
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {similarTracks.map((t: any) => (
                            <MediaCard
                                key={t.id}
                                coverUrl={t.cover_url || "/default-album.jpg"}
                                name={t.name}
                                artist={t.artist}
                                avgRating={t.avg_rating}
                                itemType="track"
                                itemId={t.id}
                            />
                        ))}
                    </div>
                </div>
            )}

            <Footer variant="light" />
        </div>
    );
};

export default SongDetailClient;
