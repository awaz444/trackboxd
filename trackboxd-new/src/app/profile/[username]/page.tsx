import React from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ActivityCard from "@/components/profile/ActivityCard";
import FavoriteTracks from "@/components/profile/FavoriteTracks";
import FollowingSection from "@/components/profile/FollowingSection";
import ProfilePrompts from "@/components/profile/ProfilePrompts";
import { Heart, Star, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ProfilePageProps {
    params: {
        username: string;
    };
}

interface ProfileData {
    user: {
        id: string;
        name: string;
        image_url?: string;
        country?: string;
        spotify_url?: string;
        instagram_url?: string;
        created_at: string;
        profile_private?: boolean;
    };
    stats: {
        followers: number;
        following: number;
        reviews: number;
        annotations: number;
    };
    favoriteTracks: Array<{
        id: string;
        name: string;
        artist: string;
        cover_url?: string;
    }>;
    recentActivity: Array<{
        id: string;
        type: "like" | "review" | "annotation";
        track: {
            id: string;
            title: string;
            artist: string;
            cover_url?: string;
        };
        timestamp: string;
        rating?: number;
        text?: string;
    }>;
    likesActivity: Array<{
        id: string;
        timestamp: string;
        sentence: string;
        links: {
            subjectProfile: string;
            targetProfile?: string;
            itemHref?: string;
        };
    }>;
    following: Array<{
        id: string;
        username: string;
        name: string;
        image_url?: string;
    }>;
    isFollowing?: boolean;
    followStatus?: 'following' | 'requested' | 'not_following';
    promptResponses?: Array<{
        id: string;
        promptKey: string;
        type: 'text' | 'track' | 'album' | 'playlist';
        item?: { id: string; type: string; name: string; artist?: string; cover_url?: string } | null;
        text?: string | null;
        created_at: string;
    }>;
}

async function getProfileData(username: string): Promise<ProfileData | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
        const url = `${baseUrl}/api/profile/${encodeURIComponent(username)}`;
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            return null;
        }

        if (process.env.NODE_ENV === "development") {
            console.log(
                "Raw response from profile API:",
                await response.clone().text()
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch profile data:", error);
        return null;
    }
}

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProfilePageProps) {
    const profileData = await getProfileData(params.username);

    if (!profileData) {
        return {
            title: "User Not Found",
        };
    }

    return {
        title: `${profileData.user.name} - Trackboxd`,
        description: `View ${profileData.user.name}'s music profile on Trackboxd. See their reviews, annotations, and favorite tracks.`,
        openGraph: {
            title: `${profileData.user.name} - Trackboxd`,
            description: `View ${profileData.user.name}'s music profile on Trackboxd.`,
            images: profileData.user.image_url
                ? [profileData.user.image_url]
                : [],
        },
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const profileData = await getProfileData(params.username);

    if (!profileData) {
        notFound();
    }

    // ADD THIS DEBUG LOG to see what's actually coming from the API
    console.log("Fetched profile data - USER OBJECT:", profileData.user);
    console.log("Spotify URL:", profileData.user.spotify_url);
    console.log("Full response:", JSON.stringify(profileData, null, 2));

    // Get current session to determine if this is the user's own profile
    const session = await getServerSession(authOptions);
    const isOwnProfile = session?.user?.id === profileData.user.id;

    // Check if current user is following this profile owner
    let initialIsFollowing = false;
    let followStatus: 'following' | 'requested' | 'not_following' = 'not_following';
    
    if (!isOwnProfile && session?.user?.id) {
        try {
            const supabase = createClient(cookies());
            const { data: follow } = await supabase
                .from("follows")
                .select("follower_id, following_id, accepted")
                .eq("follower_id", session.user.id)
                .eq("following_id", profileData.user.id)
                .single();

            if (follow) {
                if (follow.accepted) {
                    initialIsFollowing = true;
                    followStatus = 'following';
                } else {
                    followStatus = 'requested';
                }
            }
        } catch (error) {
            console.error("Failed to check follow status:", error);
        }
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
                    username={params.username}
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
                        {/* Favorite Songs */}
                        <FavoriteTracks
                            tracks={favoriteTracks}
                            isOwnProfile={isOwnProfile}
                        />

                        {/* Profile Prompts */}
                        <ProfilePrompts
                            username={params.username}
                            isOwnProfile={isOwnProfile}
                            initialResponses={profileData.promptResponses || []}
                        />

                        {/* Reviews & Annotations */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#5C5537] mb-6">
                                my recent reviews & annotations...
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Reviews Column */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Star className="text-[#5C5537] w-5 h-5" />
                                        <h3 className="font-bold text-[#5C5537]">
                                            Reviews
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {reviews.map((a) => (
                                            <div
                                                key={a.id}
                                                className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm text-[#5C5537]/70">
                                                        {a.timestamp}
                                                    </div>
                                                </div>
                                                <div className="mb-1 text-sm text-[#5C5537] flex items-center   ">
                                                    <div>
                                                        <span className="font-semibold">
                                                            {a.track.title}
                                                        </span>
                                                        <span className="text-[#5C5537]/70">
                                                            {" "}
                                                            by {a.track.artist}
                                                        </span>
                                                    </div>
                                                    {a.rating !== undefined && (
                                                        <div className="flex items-center text-[#FFBA00] text-sm ml-2">
                                                            <Star className="h-4 w-4 mr-1" />
                                                            <span>{a.rating}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {a.text && (
                                                    <div className="text-sm text-[#5C5537]/90 line-clamp-3">
                                                        {a.text}
                                                    </div>
                                                )}
                                                <div className="mt-2 text-xs">
                                                    <Link
                                                        href={`/songs/${a.track.id}`}
                                                        className="text-[#5C5537]/70 hover:text-[#5C5537]">
                                                        View track
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                        {reviews.length === 0 && (
                                            <div className="text-center text-[#5C5537]/70 py-8">
                                                No recent reviews
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Annotations Column */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageCircle className="text-[#5C5537] w-5 h-5" />
                                        <h3 className="font-bold text-[#5C5537]">
                                            Annotations
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {annotations.map((a) => (
                                            <div
                                                key={a.id}
                                                className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm text-[#5C5537]/70">
                                                        {a.timestamp}
                                                    </div>
                                                </div>
                                                <div className="mb-1 text-sm text-[#5C5537]">
                                                    <span className="font-semibold">
                                                        {a.track.title}
                                                    </span>
                                                    <span className="text-[#5C5537]/70">
                                                        {" "}
                                                        by {a.track.artist}
                                                    </span>
                                                </div>
                                                {a.text && (
                                                    <div className="text-sm text-[#5C5537]/90 line-clamp-3">
                                                        {a.text}
                                                    </div>
                                                )}
                                                <div className="mt-2 text-xs">
                                                    <Link
                                                        href={`/songs/${a.track.id}`}
                                                        className="text-[#5C5537]/70 hover:text-[#5C5537]">
                                                        View track
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                        {annotations.length === 0 && (
                                            <div className="text-center text-[#5C5537]/70 py-8">
                                                No recent annotations
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Likes */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-[#5C5537]">
                                    my recent likes...
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
