import React from "react";
import Link from "next/link";
import Image from "next/image";

interface FollowingUser {
    id: string;
    username: string;
    name: string;
    image_url?: string;
}

interface FollowingSectionProps {
    following: FollowingUser[];
    isOwnProfile: boolean;
}

export default function FollowingSection({
    following,
    isOwnProfile,
}: FollowingSectionProps) {
    // Don't render the section if there are no following users and it's not the user's own profile
    if ((!following || following.length === 0) && !isOwnProfile) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#5C5537]">
                    people i follow...
                </h2>
                {isOwnProfile && (
                    <Link
                        href="/following"
                        className="text-sm text-[#5C5537]/70 hover:text-[#5C5537]">
                        View All
                    </Link>
                )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {following.map((user) => (
                    <Link
                        key={user.id}
                        href={`/profile/${user.username}`}
                        className="flex-shrink-0 text-center group">
                        <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-[#5C5537]/10">
                            {user.image_url ? (
                                <Image
                                    src={user.image_url}
                                    alt={user.name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#5C5537]/50 text-xl font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-[#5C5537] font-medium max-w-16 truncate">
                            {user.name}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}