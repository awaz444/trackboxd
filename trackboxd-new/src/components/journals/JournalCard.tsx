"use client";

import React from "react";
import Link from "next/link";
import { Lock, BookOpen } from "lucide-react";

export interface JournalCardProps {
    id: string;
    title: string;
    subtitle?: string | null;
    cover_url?: string | null;
    is_public: boolean;
    source_type: "manual" | "spotify_playlist";
    total_tracks: number;
    reviewed_tracks: number;
    // Attribution shown on public profile cards
    reviewedBy?: string;
    reviewedByImage?: string | null;
}

const StarRow = ({ filled, total }: { filled: number; total: number }) => {
    if (total === 0) return null;
    const pct = Math.round((filled / total) * 100);
    return (
        <div className="w-full bg-[#5C5537]/10 rounded-full h-1.5 mt-1.5">
            <div
                className="bg-[#5C5537]/60 h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
};

const JournalCard: React.FC<JournalCardProps> = ({
    id,
    title,
    subtitle,
    cover_url,
    is_public,
    source_type,
    total_tracks,
    reviewed_tracks,
    reviewedBy,
    reviewedByImage,
}) => {
    return (
        <Link href={`/journals/${id}`} className="group block">
            <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                {/* Cover */}
                <div className="relative aspect-square bg-[#5C5537]/5">
                    {cover_url ? (
                        <img
                            src={cover_url}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "/default-album.jpg"; }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-[#5C5537]/30" />
                        </div>
                    )}
                    {/* Privacy badge */}
                    {!is_public && (
                        <div className="absolute top-2 right-2 bg-[#5C5537]/80 rounded-full p-1.5">
                            <Lock className="w-3 h-3 text-white" />
                        </div>
                    )}
                    {/* Reviewer attribution overlay */}
                    {reviewedBy && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-3 flex items-center gap-2">
                            {reviewedByImage ? (
                                <img
                                    src={reviewedByImage}
                                    alt={reviewedBy}
                                    className="w-6 h-6 rounded-full object-cover border border-white/40 flex-shrink-0"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-[#5C5537]/60 flex items-center justify-center border border-white/40 flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{reviewedBy[0]}</span>
                                </div>
                            )}
                            <span className="text-white text-xs font-medium truncate">
                                Reviewed by {reviewedBy}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="text-sm font-semibold text-[#5C5537] truncate leading-snug">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-[#5C5537]/60 line-clamp-2">{subtitle}</p>
                    )}
                    <div className="mt-auto pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#5C5537]/50">
                                {reviewed_tracks}/{total_tracks} reviewed
                            </span>
                            {source_type === "spotify_playlist" && (
                                <span className="text-xs text-[#5C5537]/40 italic">from Spotify</span>
                            )}
                        </div>
                        <StarRow filled={reviewed_tracks} total={total_tracks} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default JournalCard;
