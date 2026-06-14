"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Lock, Globe, Trash2, Edit2, Check, X, Music, Plus, Search, Link2, ExternalLink
} from "lucide-react";
import JournalTrackRow from "@/components/journals/JournalTrackRow";
import JournalCover from "@/components/journals/JournalCover";
import Link from "next/link";

interface Track {
    id: string;
    name: string;
    artist: string;
    album?: string | null;
    cover_url?: string | null;
}

interface JournalItem {
    id: string;
    track_id: string;
    review_id: string | null;
    is_native_review: boolean;
    sort_order: number;
    spotify_items: Track;
    reviews: {
        id: string;
        rating: number;
        text?: string | null;
    } | null;
}

interface JournalUser {
    id: string;
    name: string;
    image_url?: string | null;
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

interface JournalDetailClientProps {
    journal: {
        id: string;
        title: string;
        subtitle: string | null;
        is_public: boolean;
        source_type: "manual" | "spotify_playlist";
        spotify_playlist_id?: string | null;
        cover_url: string | null;
        user_id: string;
        users: JournalUser;
        items: JournalItem[];
        created_at: string;
    };
    currentUserId: string | null;
    annotationsByTrack: Record<string, AnnotationItem[]>;
}

const ProgressBar = ({ reviewed, total }: { reviewed: number; total: number }) => {
    if (total === 0) return null;
    const pct = Math.round((reviewed / total) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#5C5537]/60">
                <span>{reviewed} of {total} reviewed</span>
                <span>{pct}%</span>
            </div>
            <div className="w-full bg-[#5C5537]/10 rounded-full h-2">
                <div
                    className="bg-[#5C5537] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

export default function JournalDetailClient({ journal, currentUserId, annotationsByTrack }: JournalDetailClientProps) {
    const router = useRouter();
    const isOwner = currentUserId === journal.user_id;

    const [items, setItems] = useState<JournalItem[]>(journal.items);
    const [isPublic, setIsPublic] = useState(journal.is_public);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(journal.title);
    const [editSubtitle, setEditSubtitle] = useState(journal.subtitle ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAddTrack, setShowAddTrack] = useState(false);
    const [trackSearch, setTrackSearch] = useState("");
    const [trackResults, setTrackResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingTrack, setIsAddingTrack] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const reviewedCount = items.filter((i) => i.review_id !== null).length;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    const handleSaveEdit = async () => {
        if (!editTitle.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/journals/${journal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle, subtitle: editSubtitle }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setIsEditing(false);
        } catch {
            // keep editing state on error
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePrivacy = async () => {
        const newValue = !isPublic;
        setIsPublic(newValue);
        await fetch(`/api/journals/${journal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublic: newValue }),
        });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const res = await fetch(`/api/journals/${journal.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        if (res.ok) {
            router.push("/my-journals");
        } else {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleReviewSaved = (itemId: string, review: { id: string; rating: number; text?: string | null }) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, review_id: review.id, reviews: review }
                    : item
            )
        );
    };

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchRequestIdRef = useRef(0);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const searchTracks = async (q: string) => {
        const requestId = ++searchRequestIdRef.current;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/tracks/search?q=${encodeURIComponent(q)}&limit=3`);
            const data = await res.json();
            if (requestId !== searchRequestIdRef.current) return;
            setTrackResults(data.tracks?.items || []);
        } catch {
            if (requestId === searchRequestIdRef.current) setTrackResults([]);
        } finally {
            if (requestId === searchRequestIdRef.current) setIsSearching(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setTrackSearch(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!value.trim()) {
            searchRequestIdRef.current++;
            setTrackResults([]);
            setIsSearching(false);
            return;
        }
        searchTimeoutRef.current = setTimeout(() => searchTracks(value), 400);
    };

    const handleAddTrack = async (track: any) => {
        setIsAddingTrack(true);
        try {
            const res = await fetch(`/api/journals/${journal.id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackId: track.id }),
            });
            if (!res.ok) {
                const data = await res.json();
                if (data.error === "Track already in journal") return;
                throw new Error(data.error);
            }
            const newItem = await res.json();
            setItems((prev) => [...prev, newItem]);
            setTrackSearch("");
            setTrackResults([]);
            setShowAddTrack(false);
        } catch {
            // silently ignore
        } finally {
            setIsAddingTrack(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex gap-4">
                    {/* Cover */}
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-[#5C5537]/5 border border-[#5C5537]/10">
                        <JournalCover
                            coverUrl={journal.cover_url}
                            trackCovers={journal.items.map((item) => item.spotify_items?.cover_url)}
                            title={journal.title}
                            iconClassName="w-10 h-10"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-xl font-bold text-[#5C5537] bg-transparent border-b-2 border-[#5C5537]/30 focus:border-[#5C5537] focus:outline-none pb-1"
                                    placeholder="Title"
                                />
                                <input
                                    value={editSubtitle}
                                    onChange={(e) => setEditSubtitle(e.target.value)}
                                    className="w-full text-sm text-[#5C5537]/60 bg-transparent border-b border-[#5C5537]/20 focus:border-[#5C5537]/50 focus:outline-none pb-1"
                                    placeholder="Subtitle (optional)"
                                />
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving || !editTitle.trim()}
                                        className="flex items-center gap-1 text-xs font-medium bg-[#5C5537] text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                                    >
                                        <Check className="w-3 h-3" />
                                        {isSaving ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setEditTitle(journal.title); setEditSubtitle(journal.subtitle ?? ""); }}
                                        className="flex items-center gap-1 text-xs text-[#5C5537]/60 px-3 py-1.5 rounded-lg border border-[#5C5537]/20"
                                    >
                                        <X className="w-3 h-3" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-[#5C5537] leading-tight">{editTitle || journal.title}</h1>
                                {(editSubtitle || journal.subtitle) && (
                                    <p className="text-sm text-[#5C5537]/60 mt-0.5 line-clamp-2">{editSubtitle || journal.subtitle}</p>
                                )}
                                <Link href={`/profile/${journal.users.name}`} className="block mt-1">
                                    <p className="text-xs text-[#5C5537]/50 hover:text-[#5C5537]/80">
                                        Reviewed by{" "}
                                        <span className="font-medium text-[#5C5537]/70">{journal.users.name}</span>
                                    </p>
                                </Link>
                                {journal.source_type === "spotify_playlist" && (
                                    journal.spotify_playlist_id ? (
                                        <a
                                            href={`https://open.spotify.com/playlist/${journal.spotify_playlist_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-1 text-xs text-[#5C5537]/40 hover:text-[#5C5537]/70 italic transition-colors"
                                        >
                                            Imported from Spotify
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="block mt-1 text-xs text-[#5C5537]/40 italic">
                                            Imported from Spotify
                                        </span>
                                    )
                                )}
                                {!isPublic && !isOwner && (
                                    <span className="flex items-center gap-1 mt-1 text-xs text-[#5C5537]/40 italic">
                                        <Lock className="w-3 h-3" />
                                        Private journal · shared via link
                                    </span>
                                )}
                            </>
                        )}

                        {/* Controls */}
                        {!isEditing && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {isOwner && (
                                    <button
                                        onClick={handleTogglePrivacy}
                                        className="flex items-center gap-1.5 text-xs border border-[#5C5537]/20 rounded-full px-3 py-1 hover:bg-[#5C5537]/5 text-[#5C5537]/70"
                                    >
                                        {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                        {isPublic ? "Public" : "Private"}
                                    </button>
                                )}
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-1.5 text-xs border border-[#5C5537]/20 rounded-full px-3 py-1 hover:bg-[#5C5537]/5 text-[#5C5537]/70"
                                >
                                    {linkCopied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                                    {linkCopied ? "Copied!" : "Copy link"}
                                </button>
                                {isOwner && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-1.5 text-xs border border-[#5C5537]/20 rounded-full px-3 py-1 hover:bg-[#5C5537]/5 text-[#5C5537]/70"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center gap-1.5 text-xs border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 text-red-400"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-5">
                    <ProgressBar reviewed={reviewedCount} total={items.length} />
                </div>
            </div>

            {/* Delete confirm modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#FFFBEb] rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-[#5C5537] text-lg mb-2">Delete journal?</h3>
                        <p className="text-sm text-[#5C5537]/70 mb-5">
                            This will also delete any reviews you wrote specifically for this journal. Reviews you compiled from your profile will not be affected.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 text-sm border border-[#5C5537]/20 rounded-lg text-[#5C5537]/70 hover:bg-[#5C5537]/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add track panel (manual journals only) */}
            {isOwner && journal.source_type === "manual" && (
                <div className="mb-6">
                    {showAddTrack ? (
                        <div className="border border-[#5C5537]/20 rounded-xl p-4 space-y-3 bg-[#FFFBEb]">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-[#5C5537]">Add a track</p>
                                <button onClick={() => { setShowAddTrack(false); setTrackSearch(""); setTrackResults([]); }}>
                                    <X className="w-4 h-4 text-[#5C5537]/50" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5537]/40" />
                                <input
                                    type="text"
                                    value={trackSearch}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search for a track..."
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                                />
                                {trackSearch.trim() && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg shadow-lg z-20 overflow-hidden">
                                        {isSearching ? (
                                            <p className="text-xs text-[#5C5537]/50 text-center py-3">Searching...</p>
                                        ) : trackResults.length > 0 ? (
                                            <div className="divide-y divide-[#5C5537]/10">
                                                {trackResults.slice(0, 3).map((track: any) => (
                                                    <button
                                                        key={track.id}
                                                        onClick={() => handleAddTrack(track)}
                                                        disabled={isAddingTrack}
                                                        className="w-full flex items-center gap-2.5 p-2 hover:bg-[#5C5537]/5 text-left disabled:opacity-50"
                                                    >
                                                        {track.album?.images?.[0]?.url ? (
                                                            <img
                                                                src={track.album.images[0].url}
                                                                alt={track.name}
                                                                className="w-9 h-9 rounded object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded bg-[#5C5537]/10 flex-shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[#5C5537] truncate">{track.name}</p>
                                                            <p className="text-xs text-[#5C5537]/50 truncate">
                                                                {track.artists?.map((a: any) => a.name).join(", ")}
                                                            </p>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-[#5C5537]/40 flex-shrink-0" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[#5C5537]/50 text-center py-3">No tracks found.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddTrack(true)}
                            className="flex items-center gap-2 text-sm text-[#5C5537]/60 hover:text-[#5C5537] border border-dashed border-[#5C5537]/30 hover:border-[#5C5537]/50 rounded-xl px-4 py-3 w-full justify-center transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add a track
                        </button>
                    )}
                </div>
            )}

            {/* Track list */}
            {items.length === 0 ? (
                <div className="text-center py-16">
                    <Music className="w-12 h-12 text-[#5C5537]/20 mx-auto mb-3" />
                    <p className="text-[#5C5537]/50 text-sm">No tracks yet.</p>
                    {isOwner && journal.source_type === "manual" && (
                        <p className="text-[#5C5537]/40 text-xs mt-1">Add a track above to get started.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => (
                        <JournalTrackRow
                            key={item.id}
                            itemId={item.id}
                            journalId={journal.id}
                            track={item.spotify_items}
                            review={item.reviews}
                            annotations={annotationsByTrack[item.track_id] || []}
                            isOwner={isOwner}
                            journalIsPublic={isPublic}
                            onReviewSaved={handleReviewSaved}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
