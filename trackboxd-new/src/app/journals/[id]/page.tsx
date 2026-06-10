import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/get-server-user";
import JournalDetailClient from "./JournalDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: journal } = await supabase
        .from("journals")
        .select("title, subtitle, users(name)")
        .eq("id", id)
        .single();

    if (!journal) return { title: "Journal not found - Trackboxd" };

    const user = journal.users as any;
    return {
        title: `${journal.title} — Reviewed by ${user?.name} — Trackboxd`,
        description: journal.subtitle || undefined,
    };
}

export default async function JournalDetailPage({ params }: Props) {
    const { id } = await params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const currentUser = await getServerUser();

    const { data: journal, error } = await supabase
        .from("journals")
        .select(`
            *,
            users(id, name, image_url),
            journal_items(
                id, track_id, review_id, is_native_review, sort_order, created_at,
                spotify_items(id, name, artist, album, cover_url, spotify_url, duration_ms),
                reviews(id, rating, text, is_public, created_at)
            )
        `)
        .eq("id", id)
        .order("sort_order", { referencedTable: "journal_items", ascending: true })
        .single();

    if (error || !journal) notFound();

    // Private journals are unlisted, not access-restricted: anyone with the
    // direct link can view. They're simply omitted from profile listings.

    const journalUsername = (journal.users as any)?.name as string | null;

    return (
        <div className="min-h-screen bg-[#FFFBEb]">
            <div className="max-w-3xl mx-auto px-4 pt-6">
                <Link
                    href={journalUsername ? `/profile/${journalUsername}` : "/"}
                    className="inline-flex items-center gap-1.5 text-sm text-[#5C5537]/60 hover:text-[#5C5537] mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {journalUsername ? "Back to profile" : "Back home"}
                </Link>
            </div>
            <JournalDetailClient
                journal={{
                    ...journal,
                    items: (journal.journal_items || []) as any,
                }}
                currentUserId={currentUser?.id ?? null}
            />
        </div>
    );
}
