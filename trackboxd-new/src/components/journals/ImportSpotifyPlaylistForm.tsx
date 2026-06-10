"use client";

import React, { useState } from "react";
import { Search, Music, Loader2 } from "lucide-react";
import { friendlyError } from "@/lib/friendlyError";

interface PlaylistPreview {
    id: string;
    title: string;
    subtitle: string | null;
    cover_url: string | null;
    owner: string | null;
    total_tracks: number;
    tracks: {
        id: string;
        name: string;
        artist: string;
        album: string;
        cover_url: string | null;
    }[];
}

interface ImportSpotifyPlaylistFormProps {
    onConfirm: (playlist: PlaylistPreview) => void;
    isSubmitting?: boolean;
}

const ImportSpotifyPlaylistForm: React.FC<ImportSpotifyPlaylistFormProps> = ({
    onConfirm,
    isSubmitting = false,
}) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<PlaylistPreview | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        setError(null);
        setPreview(null);

        try {
            const res = await fetch(
                `/api/journals/import-preview?playlistId=${encodeURIComponent(input.trim())}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(friendlyError(data.error, "Couldn't load that playlist. Please check the link and try again."));
            setPreview(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5537]/40" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste Spotify playlist URL or ID..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] placeholder:text-[#5C5537]/40 focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="px-4 py-2.5 text-sm font-medium bg-[#5C5537] text-white rounded-lg hover:bg-[#3E3725] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preview"}
                </button>
            </form>

            {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            {preview && (
                <div className="border border-[#5C5537]/20 rounded-xl overflow-hidden">
                    {/* Playlist header */}
                    <div className="flex items-center gap-3 p-4 bg-[#5C5537]/5">
                        {preview.cover_url ? (
                            <img
                                src={preview.cover_url}
                                alt={preview.title}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-[#5C5537]/10 flex items-center justify-center flex-shrink-0">
                                <Music className="w-7 h-7 text-[#5C5537]/30" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#5C5537] truncate">{preview.title}</p>
                            {preview.subtitle && (
                                <p className="text-sm text-[#5C5537]/60 line-clamp-2">{preview.subtitle}</p>
                            )}
                            {preview.owner && (
                                <p className="text-xs text-[#5C5537]/40 mt-0.5">by {preview.owner}</p>
                            )}
                            <p className="text-xs text-[#5C5537]/50 mt-1">
                                {preview.total_tracks} track{preview.total_tracks !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* Track preview list */}
                    <div className="max-h-52 overflow-y-auto divide-y divide-[#5C5537]/10">
                        {preview.tracks.slice(0, 10).map((track) => (
                            <div key={track.id} className="flex items-center gap-2.5 px-4 py-2.5">
                                {track.cover_url ? (
                                    <img
                                        src={track.cover_url}
                                        alt={track.name}
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded bg-[#5C5537]/10 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#5C5537] truncate font-medium">{track.name}</p>
                                    <p className="text-xs text-[#5C5537]/50 truncate">{track.artist}</p>
                                </div>
                            </div>
                        ))}
                        {preview.total_tracks > 10 && (
                            <div className="px-4 py-2.5 text-xs text-[#5C5537]/40 text-center">
                                +{preview.total_tracks - 10} more tracks
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-[#5C5537]/10">
                        <button
                            onClick={() => onConfirm(preview)}
                            disabled={isSubmitting}
                            className="w-full py-2.5 text-sm font-medium bg-[#5C5537] text-white rounded-lg hover:bg-[#3E3725] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                "Import & Start Journal"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportSpotifyPlaylistForm;
