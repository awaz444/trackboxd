// app/playlists/[playlist_id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Grid, List, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import { SpotifyTrack } from "../../tracks/types";

import Link from "next/link";

interface Playlist {
    id: string;
    name: string;
    creator: string;
    cover_url: string;
    tracks: number;
    like_count: number;
    description: string;
    isLiked?: boolean;
}

interface PlaylistDetails {
    playlist: Playlist;
    items: SpotifyTrack[];
}

const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000)
        .toString()
        .padStart(2, "0");
    return `${minutes}:${seconds}`;
};

const PlaylistDetailsPage = () => {
    const { playlist_id } = useParams();
    const [playlistDetails, setPlaylistDetails] =
        useState<PlaylistDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isLiked, setIsLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);

    const { user } = useUser();

    // Fetch playlist details
    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/playlists/${playlist_id}`);

                if (!res.ok) {
                    throw new Error("Failed to fetch playlist details");
                }

                const data = await res.json();
                setPlaylistDetails(data);
            } catch (err) {
                setError((err as Error).message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylistDetails();
    }, [playlist_id]);

    // Fetch like status
    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!user || !playlistDetails) return;

            try {
                const res = await fetch(
                    `/api/likes/playlist?userId=${user.id}&playlistId=${playlistDetails.playlist.id}`
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
    }, [user, playlistDetails]);

    // Handle like click
    const handleLikeClick = async () => {
        if (!user) {
            window.location.href = "/";
            return;
        }

        if (!playlistDetails) return;

        setLikeLoading(true);
        const newIsLiked = !isLiked;

        try {
            const method = newIsLiked ? "POST" : "DELETE";
            const res = await fetch("/api/likes/playlist", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    playlistId: playlistDetails.playlist.id,
                }),
            });

            if (res.ok) {
                setIsLiked(newIsLiked);
                // Update playlist like count
                setPlaylistDetails((prev) => {
                    if (!prev) return null;

                    return {
                        ...prev,
                        playlist: {
                            ...prev.playlist,
                            like_count:
                                prev.playlist.like_count +
                                (newIsLiked ? 1 : -1),
                        },
                    };
                });
            }
        } catch (error) {
            console.error("Like operation failed:", error);
        } finally {
            setLikeLoading(false);
        }
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

    if (!playlistDetails) {
        return (
            <div className="min-h-screen bg-[#FFFBEb]">

                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <p className="text-[#5C5537]">Playlist not found</p>
                </div>
                <Footer variant="light" />
            </div>
        );
    }

    const { playlist, items } = playlistDetails;

    return (
        <div className="min-h-screen bg-[#FFFBEb]">


            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Playlist Header */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="w-full md:w-1/3 flex justify-center">
                        <div className="w-56 h-56 relative overflow-hidden rounded-xl shadow border border-[#5C5537]/20">
                            <img
                                src={
                                    playlist.cover_url ||
                                    "/default-playlist.jpg"
                                }
                                alt={`${playlist.name} cover`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/default-playlist.jpg";
                                }}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-2/3">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#5C5537] mb-1">
                            {playlist.name}
                        </h1>
                        <p className="text-lg text-[#5C5537]/70 mb-4">
                            By {playlist.creator}
                        </p>

                        <p className="text-sm text-[#5C5537] mb-6 line-clamp-3">
                            {playlist.description || "No description available"}
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4 text-[#5C5537]" />
                                <span className="text-sm text-[#5C5537]">
                                    {playlist.like_count} likes
                                </span>
                            </div>

                            <div className="flex items-center space-x-1">
                                <span className="text-sm text-[#5C5537]">
                                    {playlist.tracks} tracks
                                </span>
                            </div>

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
                        </div>
                    </div>
                </div>
                {/* Tracks Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[#5C5537]">
                            Tracks ({items.length})
                        </h2>

                        <div className="flex items-center space-x-2 bg-[#FFFBEb] rounded-lg p-1 border border-[#5C5537]/20">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md ${
                                    viewMode === "grid"
                                        ? "bg-[#5C5537] text-[#FFFBEb]"
                                        : "text-[#5C5537]"
                                }`}>
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-md ${
                                    viewMode === "list"
                                        ? "bg-[#5C5537] text-[#FFFBEb]"
                                        : "text-[#5C5537]"
                                }`}>
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {items.map((track, index) => (
                                <Link 
                                    key={track.id} 
                                    href={`/songs/${track.id}`}
                                    className="group"
                                >
                                    <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl p-4 hover:shadow-lg transition-shadow duration-200">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={
                                                    track.album.images[0]
                                                        ?.url ||
                                                    "/default-album.png"
                                                }
                                                alt={track.album.name}
                                                className="w-16 h-16 rounded object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/default-album.png";
                                                }}
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-[#5C5537] line-clamp-1 group-hover:text-[#5C5537]/80 transition-colors">
                                                    {track.name}
                                                </p>
                                                <p className="text-xs text-[#5C5537]/70 mt-1">
                                                    {track.artists
                                                        .map((a) => a.name)
                                                        .join(", ")}
                                                </p>
                                                <p className="text-xs text-[#5C5537]/50 mt-1">
                                                    {formatDuration(
                                                        track.duration_ms
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden">
                            {items.map((track, index) => (
                                <Link 
                                    key={track.id} 
                                    href={`/songs/${track.id}`}
                                    className="group"
                                >
                                    <div
                                        className={`flex items-center p-4 hover:bg-[#5C5537]/5 transition-colors duration-200 ${
                                            index < items.length - 1
                                                ? "border-b border-[#5C5537]/20"
                                                : ""
                                        }`}>
                                        <span className="text-sm text-[#5C5537]/50 w-8">
                                            {index + 1}
                                        </span>
                                        <img
                                            src={
                                                track.album.images[0]?.url ||
                                                "/default-album.png"
                                            }
                                            alt={track.album.name}
                                            className="w-12 h-12 rounded object-cover mr-3"
                                            onError={(e) => {
                                                e.currentTarget.src = "/default-album.png";
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-[#5C5537] truncate group-hover:text-[#5C5537]/80 transition-colors">
                                                {track.name}
                                            </p>
                                            <p className="text-xs text-[#5C5537]/70 truncate">
                                                {track.artists
                                                    .map((a) => a.name)
                                                    .join(", ")}
                                            </p>
                                        </div>
                                        <p className="text-xs text-[#5C5537]/50 ml-2">
                                            {formatDuration(track.duration_ms)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer variant="light" />
        </div>
    );
};

export default PlaylistDetailsPage;