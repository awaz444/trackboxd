"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Music, ArrowLeft } from "lucide-react";
import ImportSpotifyPlaylistForm from "@/components/journals/ImportSpotifyPlaylistForm";
import { friendlyError } from "@/lib/friendlyError";
import useUser from "@/hooks/useUser";
import Link from "next/link";

type SourceType = "spotify_playlist" | "manual";
type Step = "choose_source" | "configure";

export default function NewJournalPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();

    const [step, setStep] = useState<Step>("choose_source");
    const [sourceType, setSourceType] = useState<SourceType>("manual");
    // New journals are public by default; privacy can be toggled afterward on the journal page.
    const isPublic = true;

    // Manual fields
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");

    // Spotify import state
    const [spotifyPlaylistId, setSpotifyPlaylistId] = useState<string | null>(null);
    const [spotifyTitle, setSpotifyTitle] = useState("");
    const [spotifySubtitle, setSpotifySubtitle] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!userLoading && !user) {
        router.replace("/");
        return null;
    }

    const handleSourceChoice = (type: SourceType) => {
        setSourceType(type);
        setStep("configure");
    };

    const handleSpotifyConfirm = (playlist: any) => {
        setSpotifyPlaylistId(playlist.id);
        setSpotifyTitle(playlist.title);
        setSpotifySubtitle(playlist.subtitle || "");
        handleCreate({ sourceType: "spotify_playlist", spotifyPlaylistId: playlist.id, title: playlist.title, subtitle: playlist.subtitle });
    };

    const handleCreate = async (overrides?: any) => {
        setIsSubmitting(true);
        setError(null);

        const payload = overrides || {
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            sourceType,
            isPublic,
        };

        if (!payload.title?.trim()) {
            setError("Title is required");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch("/api/journals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, isPublic, userId: user?.id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(friendlyError(data.error, "Couldn't create your journal. Please try again."));
            router.push(`/journals/${data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBEb]">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Back link */}
                <Link
                    href="/my-journals"
                    className="inline-flex items-center gap-1.5 text-sm text-[#5C5537]/60 hover:text-[#5C5537] mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    My Journals
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#5C5537]">Create a new journal</h1>
                    <p className="text-[#5C5537]/60 mt-1">
                        Review a set of songs together, tell the story of what you heard.
                    </p>
                </div>

                {step === "choose_source" && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-[#5C5537]/70 uppercase tracking-wider">
                            How would you like to start?
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Spotify import */}
                            <button
                                onClick={() => handleSourceChoice("spotify_playlist")}
                                className="text-left p-5 border-2 border-[#5C5537]/20 hover:border-[#5C5537]/50 rounded-xl bg-[#FFFBEb] hover:bg-[#5C5537]/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 flex items-center justify-center mb-3">
                                    <Music className="w-5 h-5 text-[#1DB954]" />
                                </div>
                                <h3 className="font-semibold text-[#5C5537]">Import from Spotify</h3>
                                <p className="text-sm text-[#5C5537]/60 mt-1">
                                    Paste a public Spotify playlist URL. We'll pull in the tracks and fill in the title for you.
                                </p>
                            </button>

                            {/* Manual */}
                            <button
                                onClick={() => handleSourceChoice("manual")}
                                className="text-left p-5 border-2 border-[#5C5537]/20 hover:border-[#5C5537]/50 rounded-xl bg-[#FFFBEb] hover:bg-[#5C5537]/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#5C5537]/10 flex items-center justify-center mb-3">
                                    <BookOpen className="w-5 h-5 text-[#5C5537]" />
                                </div>
                                <h3 className="font-semibold text-[#5C5537]">Build from scratch</h3>
                                <p className="text-sm text-[#5C5537]/60 mt-1">
                                    Name your journal yourself and add tracks one by one — or pull in reviews you've already written.
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {step === "configure" && (
                    <div className="space-y-6">
                        <button
                            onClick={() => { setStep("choose_source"); setError(null); }}
                            className="inline-flex items-center gap-1.5 text-sm text-[#5C5537]/60 hover:text-[#5C5537]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {sourceType === "spotify_playlist" ? (
                            <div>
                                <p className="text-sm font-medium text-[#5C5537] mb-3">
                                    Paste a Spotify playlist URL or ID
                                </p>
                                <ImportSpotifyPlaylistForm
                                    onConfirm={handleSpotifyConfirm}
                                    isSubmitting={isSubmitting}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5C5537] mb-1.5">
                                        Title <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Give your journal a name..."
                                        maxLength={100}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] placeholder:text-[#5C5537]/40 focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5C5537] mb-1.5">
                                        Subtitle <span className="text-[#5C5537]/40 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subtitle}
                                        onChange={(e) => setSubtitle(e.target.value)}
                                        placeholder="A short description..."
                                        maxLength={200}
                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] placeholder:text-[#5C5537]/40 focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-500">{error}</p>
                                )}

                                <button
                                    onClick={() => handleCreate()}
                                    disabled={!title.trim() || isSubmitting}
                                    className="w-full py-3 text-sm font-semibold bg-[#5C5537] text-white rounded-xl hover:bg-[#3E3725] disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? "Creating..." : "Create Journal"}
                                </button>
                            </div>
                        )}

                        {error && sourceType === "spotify_playlist" && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
