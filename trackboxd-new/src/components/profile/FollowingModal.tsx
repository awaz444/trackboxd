"use client";

import React, { useState, useEffect } from "react";
import { X, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VipBadge } from "@/components/VipBadge";
import { RowListSkeleton, pendingClass } from "@/components/ui/skeleton";

interface Following {
  id: string;
  username: string;
  name: string;
  image_url?: string;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isOwnProfile: boolean;
}

const FollowingModal: React.FC<FollowingModalProps> = ({
  isOpen,
  onClose,
  userId,
  isOwnProfile,
}) => {
  const [following, setFollowing] = useState<Following[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFollowing();
    }
  }, [isOpen, userId]);

  const fetchFollowing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/following`);
      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }
      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (followingId: string) => {
    setUnfollowingId(followingId);
    try {
      const response = await fetch(`/api/users/following/${followingId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to unfollow user");
      }
      
      // Update the following list
      setFollowing(following.filter(user => user.id !== followingId));
    } catch (error) {
      console.error("Error unfollowing user:", error);
    } finally {
      setUnfollowingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#FFFBEb] rounded-lg w-full max-w-md mx-4 z-50 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg font-semibold text-[#5C5537]">Following</h2>
          <button
            onClick={onClose}
            className="text-[#6B6547] hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <RowListSkeleton count={4} media="round" size="w-10 h-10" trailing={isOwnProfile} className="px-2" />
          ) : following.length === 0 ? (
            <div className="text-center py-8 text-[#6B6547]">
              Not following anyone yet
            </div>
          ) : (
            <div className="space-y-3">
              {following.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-[#5C5537]/5 rounded-md"
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
                      <div className="font-medium text-[#5C5537] flex items-center gap-1">
                        {user.name}
                        <VipBadge username={user.name} />
                      </div>
                      {/* <div className="text-sm text-[#6B6547]">
                        @{user.username}
                      </div> */}
                    </div>
                  </Link>
                  
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-[#6B6547] hover:text-red-500 hover:bg-red-50 ${unfollowingId === user.id ? pendingClass : ""}`}
                      onClick={() => handleUnfollow(user.id)}
                      disabled={unfollowingId === user.id}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;