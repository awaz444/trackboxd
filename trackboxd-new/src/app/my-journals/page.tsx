"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import JournalCard from "@/components/journals/JournalCard";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";

interface Journal {
    id: string;
    title: string;
    subtitle: string | null;
    cover_url: string | null;
    is_public: boolean;
    source_type: "manual" | "spotify_playlist";
    total_tracks: number;
    reviewed_tracks: number;
    created_at: string;
}

export default function MyJournalsPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLoading) return;
        if (!user) { router.replace("/"); return; }

        fetch("/api/my-journals")
            .then((r) => r.json())
            .then((data) => setJournals(Array.isArray(data) ? data : []))
            .catch(() => setJournals([]))
            .finally(() => setLoading(false));
    }, [user, userLoading, router]);

    return (
        <div className="min-h-screen bg-[#FFFBEb]">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#5C5537]">my journals</h1>
                        <p className="text-[#5C5537]/60 mt-1">
                            Curated sets of songs reviewed together.
                        </p>
                    </div>
                    <Link
                        href="/journals/new"
                        className="flex items-center gap-2 text-sm font-medium bg-[#5C5537] text-white px-4 py-2.5 rounded-xl hover:bg-[#3E3725] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Journal
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#5C5537] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : journals.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-[#5C5537]/20 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-[#5C5537] mb-2">No journals yet</h3>
                        <p className="text-[#5C5537]/60 mb-6">
                            Create your first journal — import a Spotify playlist or start from scratch.
                        </p>
                        <Link
                            href="/journals/new"
                            className="inline-flex items-center gap-2 text-sm font-medium bg-[#5C5537] text-white px-5 py-2.5 rounded-xl hover:bg-[#3E3725] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Journal
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {journals.map((journal) => (
                            <JournalCard
                                key={journal.id}
                                id={journal.id}
                                title={journal.title}
                                subtitle={journal.subtitle}
                                cover_url={journal.cover_url}
                                is_public={journal.is_public}
                                source_type={journal.source_type}
                                total_tracks={journal.total_tracks}
                                reviewed_tracks={journal.reviewed_tracks}
                            />
                        ))}
                        {/* Add new card */}
                        <Link
                            href="/journals/new"
                            className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-[#5C5537]/20 hover:border-[#5C5537]/40 rounded-xl text-[#5C5537]/40 hover:text-[#5C5537]/60 transition-colors"
                        >
                            <Plus className="w-8 h-8 mb-1" />
                            <span className="text-xs font-medium">New</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
