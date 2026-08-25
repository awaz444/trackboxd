"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Check, Music, ChevronDown, ChevronUp } from "lucide-react";
import Rating from "@mui/material/Rating";
import StarIcon from "@mui/icons-material/Star";
import { friendlyError } from "@/lib/friendlyError";

interface Track {
    id: string;
    name: string;
    artist: string;
    album?: string | null;
    cover_url?: string | null;
}

interface ReviewData {
    id: string;
    rating: number;
    text?: string | null;
}

interface AnnotationItem {
    id: string;
    timestamp: number;
    text: string;
    created_at: string;
    users: {
        id: string;
        name: string;
        image_url?: string | null;
    };
}

interface JournalTrackRowProps {
    itemId: string;
    journalId: string;
    track: Track;
    review?: ReviewData | null;
    annotations?: AnnotationItem[];
    isOwner: boolean;
    journalIsPublic: boolean;
    removedFromSource?: boolean;
    onReviewSaved?: (itemId: string, review: ReviewData) => void;
}

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (secondsAgo < 60) return secondsAgo === 1 ? "1 second ago" : `${secondsAgo} seconds ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return minutesAgo === 1 ? "1 minute ago" : `${minutesAgo} minutes ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
};

const formatTimestamp = (seconds: number) => {
    const total = Math.round(seconds || 0);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="relative w-4 h-4 text-base leading-none">
                <span className="absolute text-[#5C5537]/30">★</span>
                <span
                    className="absolute text-[#FFBA00] overflow-hidden"
                    style={{ width: `${Math.max(0, Math.min(1, rating - star + 1)) * 100}%` }}
                >★</span>
            </div>
        ))}
    </div>
);

const JournalTrackRow: React.FC<JournalTrackRowProps> = ({
    itemId,
    journalId,
    track,
    review,
    annotations = [],
    isOwner,
    journalIsPublic,
    removedFromSource = false,
    onReviewSaved,
}) => {
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState<number>(review?.rating ?? 0);
    const [text, setText] = useState(review?.text ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localReview, setLocalReview] = useState<ReviewData | null>(review ?? null);
    const [expanded, setExpanded] = useState(false);

    const hasComments = annotations.length > 0;

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
        <div className={`border border-[#5C5537]/15 rounded-xl bg-[#FFFBEb] overflow-hidden ${removedFromSource ? "opacity-60" : ""}`}>
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
                    {removedFromSource && (
                        <p className="text-xs text-amber-600/80 italic mt-0.5">Removed from Spotify playlist</p>
                    )}
                </div>

                {/* Right side: action (only when no review yet) */}
                {!localReview && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isOwner ? (
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
                    </div>
                )}
            </div>

            {/* Prominent rating + review */}
            {localReview && (
                <div className="border-t border-[#5C5537]/10 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <StarDisplay rating={localReview.rating} />
                            <span className="text-sm font-bold text-[#5C5537]">{localReview.rating.toFixed(1)}</span>
                        </div>
                        {isOwner && (
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="text-xs text-[#5C5537]/50 hover:text-[#5C5537] underline"
                            >
                                edit
                            </button>
                        )}
                    </div>
                    {localReview.text && (
                        <p className="text-sm text-[#5C5537] leading-relaxed whitespace-pre-wrap mt-2">{localReview.text}</p>
                    )}
                </div>
            )}

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

            {/* Toggle for comments */}
            {hasComments && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-[#5C5537]/50 hover:text-[#5C5537] py-1.5 border-t border-[#5C5537]/10 transition-colors"
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? "Hide comments" : `Show comments (${annotations.length})`}
                </button>
            )}

            {/* Expanded comments */}
            {expanded && hasComments && (
                <div className="border-t border-[#5C5537]/10 p-3 bg-[#5C5537]/[0.03] space-y-3">
                    {annotations.map((annotation) => (
                        <div key={annotation.id} className="flex gap-2.5">
                            <img
                                src={annotation.users.image_url || "/default-avatar.jpg"}
                                alt={annotation.users.name}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                                onError={(e) => { e.currentTarget.src = "/default-avatar.jpg"; }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link
                                        href={`/profile/${encodeURIComponent(annotation.users.name)}`}
                                        className="text-xs font-medium text-[#5C5537] hover:underline"
                                    >
                                        {annotation.users.name}
                                    </Link>
                                    <span className="text-xs text-[#5C5537]/40">at {formatTimestamp(annotation.timestamp)}</span>
                                    <span className="text-xs text-[#5C5537]/30">·</span>
                                    <span className="text-xs text-[#5C5537]/40">{formatTimeAgo(annotation.created_at)}</span>
                                </div>
                                <p className="text-sm text-[#5C5537] mt-0.5 whitespace-pre-wrap">{annotation.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JournalTrackRow;
