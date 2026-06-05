"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VipBadge } from "@/components/VipBadge";

interface Follower {
  id: string;
  username: string;
  name: string;
  image_url?: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isOwnProfile: boolean;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  isOwnProfile,
}) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  const fetchFollowers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/followers`);
      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }
      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    setRemovingId(followerId);
    try {
      const response = await fetch(`/api/users/followers/${followerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove follower");
      }

      // Update the followers list
      setFollowers(
        followers.filter((follower) => follower.id !== followerId)
      );
    } catch (error) {
      console.error("Error removing follower:", error);
    } finally {
      setRemovingId(null);
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
      <div className="relative bg-[#FFFBEb] rounded-lg w-full max-w-md mx-4 z-50 border border-[#5C5537]/20">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#5C5537]/10">
          <h2 className="text-lg font-semibold text-[#5C5537]">Followers</h2>
          <button
            onClick={onClose}
            className="text-[#5C5537]/70 hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#5C5537]" />
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-[#5C5537]/70">
              No followers yet
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center justify-between p-2 hover:bg-[#5C5537]/5 rounded-md"
                >
                  <Link
                    href={`/profile/${follower.name}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <img
                      src={follower.image_url || "/default-avatar.jpg"}
                      alt={follower.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-[#5C5537] flex items-center gap-1">
                        {follower.name}
                        <VipBadge username={follower.name} />
                      </div>
                      {/* <div className="text-sm text-[#5C5537]/70">
                        @{follower.username}
                      </div> */}
                    </div>
                  </Link>

                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#5C5537]/70 hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveFollower(follower.id)}
                      disabled={removingId === follower.id}
                    >
                      {removingId === follower.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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

export default FollowersModal;
