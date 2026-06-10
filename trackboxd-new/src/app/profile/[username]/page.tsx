import React from "react";
import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ActivityCard from "@/components/profile/ActivityCard";
import FavoriteTracks from "@/components/profile/FavoriteTracks";
import FollowingSection from "@/components/profile/FollowingSection";
import ProfilePrompts from "@/components/profile/ProfilePrompts";
import { Heart, Star, MessageCircle, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import ProfileReviewCard from "@/components/profile/ProfileReviewCard";
import ProfileAnnotationCard from "@/components/profile/ProfileAnnotationCard";
import { ProfileJsonLd } from "@/components/seo/JsonLd";
import JournalCard from "@/components/journals/JournalCard";

interface ProfilePageProps {
    params: {
        username: string;
    };
}

import { getProfileByUsername, type ProfileData } from "@/lib/profile-service";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProfilePageProps) {
    const { username } = await params;
    const profileData = await getProfileByUsername(username);

    if (!profileData) {
        return {
            title: "User Not Found - Trackboxd",
        };
    }

    const { user, stats } = profileData;

    if (user.profile_private) {
        return {
            title: "Private Profile - Trackboxd",
            description: "This user's profile is private.",
            robots: { index: false, follow: false },
            alternates: {
                canonical: `https://trackboxd.com/profile/${params.username}`,
            },
        };
    }

    const reviewedTracks = profileData.recentActivity
        .filter((a) => a.type === 'review')
        .slice(0, 3)
        .map((a) => `${a.track.title} by ${a.track.artist}`);

    const description = reviewedTracks.length > 0
        ? `${user.name} reviewed ${reviewedTracks.join(', ')}${stats.reviews > 3 ? `, and ${stats.reviews - 3} more` : ''} on Trackboxd.`
        : `${user.name} has written ${stats.reviews} reviews and ${stats.annotations} annotations on Trackboxd.`;

    return {
        title: `${user.name} (@${username}) — Trackboxd`,
        description,
        alternates: {
            canonical: `https://trackboxd.com/profile/${username}`,
        },
        openGraph: {
            title: `${user.name} (@${username}) — Trackboxd`,
            description,
            images: user.image_url ? [user.image_url] : [],
        },
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const currentUser = await getServerUser();
    const profileData = await getProfileByUsername(username, currentUser?.id);

    if (!profileData) {
        notFound();
    }

    const isOwnProfile = currentUser?.id === profileData.user.id;
    const initialIsFollowing = profileData.isFollowing || false;
    const followStatus = profileData.followStatus || 'not_following';

    // Fetch journals (public only for others; all for own profile)
    let journals: any[] = [];
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: profileUser } = await supabase
            .from("users")
            .select("id")
            .eq("name", username)
            .single();

        if (profileUser) {
            let jq = supabase
                .from("journals")
                .select("id, title, subtitle, cover_url, is_public, source_type, created_at")
                .eq("user_id", profileUser.id)
                .order("created_at", { ascending: false });

            if (!isOwnProfile) jq = jq.eq("is_public", true);

            const { data: jData } = await jq;
            if (jData && jData.length > 0) {
                // Fetch progress counts
                journals = await Promise.all(
                    jData.map(async (j: any) => {
                        const [{ count: total }, { count: reviewed }] = await Promise.all([
                            supabase.from("journal_items").select("*", { count: "exact", head: true }).eq("journal_id", j.id),
                            supabase.from("journal_items").select("*", { count: "exact", head: true }).eq("journal_id", j.id).not("review_id", "is", null),
                        ]);
                        return { ...j, total_tracks: total ?? 0, reviewed_tracks: reviewed ?? 0 };
                    })
                );
            }
        }
    } catch {
        // Non-critical: journals silently fail
    }

    const {
        user,
        stats = {
            followers: 0,
            following: 0,
            reviews: 0,
            annotations: 0,
        },
        favoriteTracks = [],
        recentActivity = [],
        likesActivity = [],
        following = [],
    } = profileData;

    // Determine if content should be hidden for private profiles
    const isPrivateProfile = user.profile_private;
    const canViewPrivateContent = isOwnProfile || (isPrivateProfile && initialIsFollowing);
    const shouldHideContent = isPrivateProfile && !canViewPrivateContent;

    const reviews = (recentActivity || [])
        .filter((a) => a && a.type === "review")
        .slice(0, 5);
    const annotations = (recentActivity || [])
        .filter((a) => a && a.type === "annotation")
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#FFFBEb]">
            <ProfileJsonLd user={{ ...user, stats } as any} username={username} />
            {/* <Header /> */}

            <div className="max-w-5xl mx-auto px-4 py-8">
                <ProfileHeader
                    user={{
                        id: user.id,
                        name: user.name,
                        image_url: user.image_url,
                        country: user.country,
                        spotify_url: user.spotify_url,
                        instagram_url: (user as any).instagram_url,
                        created_at: user.created_at,
                    }}
                    stats={stats}
                    isOwnProfile={isOwnProfile}
                    username={username}
                    initialIsFollowing={initialIsFollowing}
                    followStatus={followStatus}
                    isPrivateProfile={isPrivateProfile}
                />

                {shouldHideContent ? (
                    // Private profile message
                    <div className="text-center py-16">
                        <div className="bg-white/50 rounded-lg p-8 max-w-md mx-auto">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold text-[#5C5537] mb-2">
                                This account is private
                            </h3>
                            <p className="text-[#5C5537]/70 mb-4">
                                Follow this account to see their activity, favorite tracks, and more.
                            </p>
                            {followStatus === 'requested' && (
                                <p className="text-[#5C5537]/70 text-sm">
                                    Follow request sent
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Favorite Tracks */}
                        <FavoriteTracks
                            tracks={favoriteTracks}
                            isOwnProfile={isOwnProfile}
                        />

                        {/* Profile Prompts */}
                        <ProfilePrompts
                            username={username}
                            isOwnProfile={isOwnProfile}
                            initialResponses={profileData.promptResponses || []}
                        />

                        {/* Reviews & Annotations */}
                        {(reviews.length > 0 || annotations.length > 0) && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-[#5C5537] mb-6">
                                    My recent reviews & annotations...
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Reviews Column */}
                                    {reviews.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Star className="text-[#5C5537] w-5 h-5" />
                                                <h3 className="font-bold text-[#5C5537]">
                                                    Reviews
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                {reviews.map((a) => (
                                                    <ProfileReviewCard 
                                                        key={a.id} 
                                                        review={a as any} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Annotations Column */}
                                    {annotations.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <MessageCircle className="text-[#5C5537] w-5 h-5" />
                                                <h3 className="font-bold text-[#5C5537]">
                                                    Annotations
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                {annotations.map((a) => (
                                                    <ProfileAnnotationCard 
                                                        key={a.id} 
                                                        annotation={a as any} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Likes */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    My recent likes...
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {(likesActivity || []).map((l) => {
                                    const renderSentenceWithEmbeddedLinks = () => {
                                        const sentence = l.sentence;
                                        const links = l.links;

                                        const parts = sentence.split(" ");
                                        const subject = parts[0]; // Always the profile owner
                                        const verb = parts[1]; // Always "liked"

                                        let remainingParts = parts.slice(2);
                                        let result = [];

                                        // Just render the subject as plain text, but keep it semibold
                                        result.push(
                                            <span
                                                key="subject"
                                                className="font-semibold text-[#5C5537]">
                                                {subject}
                                            </span>
                                        );
                                        result.push(" ");
                                        result.push(
                                            <span className="font-medium text-[#5C5537]/70">
                                                {verb}
                                            </span>
                                        );
                                        result.push(" ");

                                        // Check if there's a target user (contains apostrophe s)
                                        const targetIndex = remainingParts.findIndex(
                                            (part) => part.includes("'s")
                                        );
                                        if (targetIndex !== -1 && links.targetProfile) {
                                            const targetName = remainingParts[
                                                targetIndex
                                            ].replace("'s", "");

                                            // Add target user link with semibold
                                            result.push(
                                                <Link
                                                    key="target"
                                                    href={links.targetProfile}
                                                    className="font-semibold text-[#5C5537] hover:underline">
                                                    {targetName}
                                                </Link>
                                            );
                                            result.push("'s ");

                                            remainingParts = [
                                                ...remainingParts.slice(0, targetIndex),
                                                ...remainingParts.slice(
                                                    targetIndex + 1
                                                ),
                                            ];
                                        }

                                        // Add the type (playlist, album, annotation, review, etc.) with medium weight
                                        if (remainingParts.length > 0) {
                                            result.push(
                                                <span className="font-medium text-[#5C5537]/70">
                                                    {remainingParts[0]}
                                                </span>
                                            );
                                            result.push(" ");
                                            remainingParts = remainingParts.slice(1);
                                        }

                                        // Handle "on" or "of" prepositions with medium weight
                                        if (
                                            remainingParts.length > 0 &&
                                            (remainingParts[0] === "on" ||
                                                remainingParts[0] === "of")
                                        ) {
                                            result.push(
                                                <span className="font-medium text-[#5C5537]/70">
                                                    {remainingParts[0]}
                                                </span>
                                            );
                                            result.push(" ");
                                            remainingParts = remainingParts.slice(1);
                                        }

                                        // The remaining parts are the item name - link them with semibold
                                        if (
                                            remainingParts.length > 0 &&
                                            links.itemHref
                                        ) {
                                            const itemText = remainingParts.join(" ");
                                            result.push(
                                                <Link
                                                    key="item"
                                                    href={links.itemHref}
                                                    className="font-semibold text-[#5C5537] hover:underline">
                                                    {itemText}
                                                </Link>
                                            );
                                        } else if (remainingParts.length > 0) {
                                            // If no item link, just add the text with medium weight
                                            result.push(
                                                <span className="font-medium text-[#5C5537]/70">
                                                    {remainingParts.join(" ")}
                                                </span>
                                            );
                                        }

                                        return result;
                                    };

                                    return (
                                        <div className="text-sm text-[#5C5537]">
                                            {renderSentenceWithEmbeddedLinks()}
                                        </div>
                                    );
                                })}
                                {(!likesActivity || likesActivity.length === 0) && (
                                    <div className="text-center text-[#5C5537]/70 py-8">
                                        No recent likes
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Journals Section */}
                        {(journals.length > 0 || isOwnProfile) && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="text-[#5C5537] w-5 h-5" />
                                        <h2 className="text-2xl font-bold text-[#5C5537]">
                                            My journals...
                                        </h2>
                                    </div>
                                    {isOwnProfile && (
                                        <Link
                                            href="/journals/new"
                                            className="flex items-center gap-1.5 text-xs font-medium text-[#5C5537]/60 hover:text-[#5C5537] border border-[#5C5537]/20 hover:border-[#5C5537]/40 rounded-full px-3 py-1.5 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            New
                                        </Link>
                                    )}
                                </div>
                                {journals.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {journals.map((journal: any) => (
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
                                                reviewedBy={user.name}
                                                reviewedByImage={user.image_url}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 border border-dashed border-[#5C5537]/20 rounded-xl">
                                        <BookOpen className="w-10 h-10 text-[#5C5537]/20 mx-auto mb-2" />
                                        <p className="text-sm text-[#5C5537]/50">No journals yet.</p>
                                        <Link
                                            href="/journals/new"
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C5537]/60 hover:text-[#5C5537] mt-2"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Start your first journal
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Following Section */}
                        <FollowingSection
                            following={following}
                            isOwnProfile={isOwnProfile}
                        />
                    </>
                )}
            </div>

            <Footer variant="light" />
        </div>
    );
}