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
        username: string;
        image_url?: string;
        country?: string;
        created_at: string;
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
    }>;
    following: Array<{
        id: string;
        username: string;
        name: string;
        image_url?: string;
    }>;
}

async function getProfileData(username: string): Promise<ProfileData | null> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/profile/${username}`,
            {
                cache: "no-store", // Prevent caching
            }
        );

        if (!response.ok) {
            return null;
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
        description: `View ${profileData.user.username}'s music profile on Trackboxd. See their reviews, annotations, and favorite tracks.`,
        openGraph: {
            title: `${profileData.user.username} - Trackboxd`,
            description: `View ${profileData.user.username}'s music profile on Trackboxd.`,
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

    // Get current session to determine if this is the user's own profile
    const session = await getServerSession(authOptions);
    const isOwnProfile = session?.user?.id === profileData.user.id;
    
    // Check if current user is following this profile owner
    let initialIsFollowing = false;
    if (!isOwnProfile && session?.user?.id) {
        try {
            const supabase = createClient(cookies());
            const { data: follow } = await supabase
                .from("follows")
                .select("follower_id, following_id")
                .eq("follower_id", session.user.id)
                .eq("following_id", profileData.user.id)
                .single();
            
            initialIsFollowing = !!follow;
        } catch (error) {
            console.error('Failed to check follow status:', error);
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
        following = [],
    } = profileData;

    const likedActivity =
        recentActivity?.filter((a) => a?.type === "like")?.slice(0, 4) || [];
    const reviewedActivity =
        recentActivity?.filter((a) => a?.type === "review")?.slice(0, 4) || [];
    const annotatedActivity =
        recentActivity?.filter((a) => a?.type === "annotation")?.slice(0, 4) ||
        [];

    return (
        <div className="min-h-screen bg-[#FFFBEb]">
            {/* <Header /> */}

            <div className="max-w-5xl mx-auto px-4 py-8">
                <ProfileHeader
                    user={user}
                    stats={stats}
                    isOwnProfile={isOwnProfile}
                    username={params.username}
                    initialIsFollowing={initialIsFollowing}
                />

                {/* Favorite Songs */}
                <FavoriteTracks
                    tracks={favoriteTracks}
                    isOwnProfile={isOwnProfile}
                />

                {/* Recent Activity */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#5C5537] mb-6">
                        Recent Activity
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recently Liked */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="text-[#5C5537] w-5 h-5" />
                                <h3 className="font-bold text-[#5C5537]">
                                    Recently Liked
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {likedActivity?.map(
                                    (activity) =>
                                        activity && (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={activity}
                                            />
                                        )
                                )}
                                {(!likedActivity ||
                                    likedActivity.length === 0) && (
                                    <div className="text-center text-[#5C5537]/70 py-8">
                                        No recent likes
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recently Reviewed */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="text-[#5C5537] w-5 h-5" />
                                <h3 className="font-bold text-[#5C5537]">
                                    Recently Reviewed
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {reviewedActivity?.map(
                                    (activity) =>
                                        activity && (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={activity}
                                            />
                                        )
                                )}
                                {(!reviewedActivity ||
                                    reviewedActivity.length === 0) && (
                                    <div className="text-center text-[#5C5537]/70 py-8">
                                        No recent reviews
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageCircle className="text-[#5C5537] w-5 h-5" />
                            <h3 className="font-bold text-[#5C5537]">
                                Recently Annotated
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {annotatedActivity?.map(
                                (activity) =>
                                    activity && (
                                        <ActivityCard
                                            key={activity.id}
                                            activity={activity}
                                        />
                                    )
                            )}
                            {(!annotatedActivity ||
                                annotatedActivity.length === 0) && (
                                <div className="text-center text-[#5C5537]/70 py-8">
                                    No recent annotations
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Following Section */}
                <FollowingSection
                    following={following}
                    isOwnProfile={isOwnProfile}
                />
            </div>

            <Footer variant="light" />
        </div>
    );
}
