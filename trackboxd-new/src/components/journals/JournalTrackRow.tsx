"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, Plus, Check, Music } from "lucide-react";
import Rating from "@mui/material/Rating";
import StarIcon from "@mui/icons-material/Star";
import { friendlyError } from "@/lib/friendlyError";

interface Track {
    id: string;
    name: string;
    artist: string;
    album?: string | null;
    cover_url?: string | null;
    duration_ms?: number | null;
}

interface ReviewData {
    id: string;
    rating: number;
    text?: string | null;
}

interface JournalTrackRowProps {
    itemId: string;
    journalId: string;
    track: Track;
    review?: ReviewData | null;
    isOwner: boolean;
    journalIsPublic: boolean;
    onReviewSaved?: (itemId: string, review: ReviewData) => void;
}

const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="relative w-3.5 h-3.5 text-sm leading-none">
                <span className="absolute text-[#5C5537]/30">★</span>
                <span
                    className="absolute text-[#FFBA00] overflow-hidden"
                    style={{ width: `${Math.max(0, Math.min(1, rating - star + 1)) * 100}%` }}
                >★</span>
            </div>
        ))}
    </div>
);

function formatDuration(ms: number | null | undefined) {
    if (!ms) return null;
    const total = Math.round(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

const JournalTrackRow: React.FC<JournalTrackRowProps> = ({
    itemId,
    journalId,
    track,
    review,
    isOwner,
    journalIsPublic,
    onReviewSaved,
}) => {
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState<number>(review?.rating ?? 0);
    const [text, setText] = useState(review?.text ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localReview, setLocalReview] = useState<ReviewData | null>(review ?? null);

    const handleSubmit = async () => {
        if (!rating || !text.trim()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/journals/${journalId}/items/${itemId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, text: text.trim() }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(friendlyError(data.error, "Failed to save your review."));
            }

            const saved = await res.json();
            const newReview: ReviewData = { id: saved.id || saved.reviewId, rating, text: text.trim() };
            setLocalReview(newReview);
            setShowForm(false);
            onReviewSaved?.(itemId, newReview);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border border-[#5C5537]/15 rounded-xl bg-[#FFFBEb] overflow-hidden">
            <div className="flex items-center gap-3 p-3">
                {/* Cover */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#5C5537]/10 flex-shrink-0">
                    {track.cover_url ? (
                        <img
                            src={track.cover_url}
                            alt={track.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "/default-album.jpg"; }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-[#5C5537]/30" />
                        </div>
                    )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                    <Link href={`/songs/${track.id}`} className="hover:underline">
                        <p className="text-sm font-semibold text-[#5C5537] truncate">{track.name}</p>
                    </Link>
                    <p className="text-xs text-[#5C5537]/60 truncate">{track.artist}</p>
                    {track.album && (
                        <p className="text-xs text-[#5C5537]/40 truncate">{track.album}</p>
                    )}
                </div>

                {/* Right side: rating or action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {localReview ? (
                        <div className="flex flex-col items-end gap-0.5">
                            <StarDisplay rating={localReview.rating} />
                            {localReview.text && (
                                <span className="text-xs text-[#5C5537]/50 italic">reviewed</span>
                            )}
                            {isOwner && (
                                <button
                                    onClick={() => { setShowForm(!showForm); }}
                                    className="text-xs text-[#5C5537]/50 hover:text-[#5C5537] underline mt-0.5"
                                >
                                    edit
                                </button>
                            )}
                        </div>
                    ) : isOwner ? (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-1 text-xs font-medium text-[#5C5537]/60 hover:text-[#5C5537] border border-[#5C5537]/20 hover:border-[#5C5537]/40 rounded-full px-2.5 py-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Review
                        </button>
                    ) : (
                        <span className="text-xs text-[#5C5537]/30 italic">not yet reviewed</span>
                    )}
                    {formatDuration(track.duration_ms) && (
                        <span className="text-xs text-[#5C5537]/30 hidden sm:block">
                            {formatDuration(track.duration_ms)}
                        </span>
                    )}
                </div>
            </div>

            {/* Inline review form */}
            {showForm && isOwner && (
                <div className="border-t border-[#5C5537]/10 p-3 bg-[#5C5537]/5 space-y-3">
                    <div className="flex items-center gap-3">
                        <Rating
                            name={`rating-${itemId}`}
                            value={rating}
                            precision={0.5}
                            size="medium"
                            onChange={(_, v) => setRating(v || 0)}
                            icon={<StarIcon className="text-[#5C5537]" fontSize="inherit" />}
                            emptyIcon={<StarIcon style={{ opacity: 0.4 }} fontSize="inherit" />}
                        />
                        <span className="text-xs text-[#5C5537]/50">{rating > 0 ? rating.toFixed(1) : "Rate"}</span>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write your thoughts... (required)"
                        className="w-full text-sm p-2.5 rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40 resize-none"
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setError(null); }}
                            className="text-xs text-[#5C5537]/60 hover:text-[#5C5537] px-3 py-1.5 rounded-lg border border-[#5C5537]/20"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!rating || !text.trim() || isSubmitting}
                            className="flex items-center gap-1.5 text-xs font-medium bg-[#5C5537] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-[#3E3725] transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Check className="w-3 h-3" />
                            )}
                            {localReview ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalTrackRow;
