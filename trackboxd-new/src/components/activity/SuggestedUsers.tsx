"use client";

import { useState } from "react";
import { UserPlus, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFollow } from "@/hooks/useFollow";

interface User {
  id: string;
  name: string;
  username: string;
  image_url?: string;
}

interface SuggestedUsersProps {
  users: User[];
  onFollowSuccess?: () => void;
}

export default function SuggestedUsers({ users, onFollowSuccess }: SuggestedUsersProps) {
  // Track which users have been followed during this session
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#5C5537]/5 rounded-lg p-4 mb-8">
      <h3 className="text-lg font-semibold text-[#5C5537] mb-3">
        Suggested Users to Follow
      </h3>
      <div className="space-y-3">
        {users.map((user) => {
          // Use the useFollow hook for each user
          const { isFollowing, isLoading, toggleFollow } = useFollow({
            userId: user.id,
            initialIsFollowing: followedUsers[user.id] || false,
            initialFollowerCount: 0 // Not displaying follower count in this component
          });
          
          const handleUserFollow = async () => {
            await toggleFollow();
            setFollowedUsers(prev => ({ ...prev, [user.id]: true }));
            if (onFollowSuccess) onFollowSuccess();
          };
          
          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 hover:bg-[#5C5537]/10 rounded-md transition-colors"
            >
              <Link
                href={`/profile/${user.name}`}
                className="flex items-center gap-3 flex-1"
              >
                <img
                  src={user.image_url || "/default-avatar.jpg"}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-[#5C5537]">
                    {user.name}
                  </div>
                  {/* <div className="text-sm text-[#5C5537]/70">
                    @{user.username}
                  </div> */}
                </div>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                className={`text-[#5C5537] border-[#5C5537]/30 hover:bg-[#5C5537]/10 ${
                  isFollowing ? "bg-[#5C5537]/20" : ""
                }`}
                onClick={handleUserFollow}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  isFollowing ? (
                    <Users className="h-4 w-4 mr-1" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-1" />
                  )
                )}
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}