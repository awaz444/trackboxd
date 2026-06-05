// ProfileHeader.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import FollowRequestsModal from "./FollowRequestsModal";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { VipBadge } from "@/components/VipBadge";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    image_url?: string;
    country?: string;
    spotify_url?: string;
    instagram_url?: string;
    created_at: string;
  };
  stats: {
    followers: number;
    following: number;
    reviews: number;
    annotations: number;
  };
  isOwnProfile: boolean;
  username: string;
  initialIsFollowing?: boolean;
  followStatus?: 'following' | 'requested' | 'not_following';
  isPrivateProfile?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  isOwnProfile = false,
  username,
  initialIsFollowing = false,
  followStatus = 'not_following',
  isPrivateProfile = false,
}) => {
  const router = useRouter();
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isFollowRequestsModalOpen, setIsFollowRequestsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const { user: session } = useAuth();

  const { followStatus: currentFollowStatus, followerCount, isLoading, toggleFollow } = useFollow({
    userId: user.id,
    initialFollowStatus: followStatus,
    initialFollowerCount: stats.followers,
  });

  // Fetch pending requests count for notification badge
  useEffect(() => {
    if (isOwnProfile && isPrivateProfile) {
      const fetchPendingRequestsCount = async () => {
        try {
          const response = await fetch('/api/follow-requests');
          if (response.ok) {
            const data = await response.json();
            setPendingRequestsCount(data.requests?.length || 0);
          }
        } catch (error) {
          console.error('Error fetching pending requests count:', error);
        }
      };

      fetchPendingRequestsCount();
    }
  }, [isOwnProfile, isPrivateProfile]);

  const handleEditClick = () => {
    router.push(`/profile/${username}/edit`);
  };

  const normalizeSpotifyUrl = (raw?: string) => {
    if (!raw) return undefined;
    const trimmed = raw.trim().replace(/\$0$/, '');
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^open\.spotify\.com\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };
  const normalizedSpotifyUrl = normalizeSpotifyUrl(user.spotify_url);

  const handleFollowClick = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }
    await toggleFollow();
  };

  const normalizeInstagramUrl = (raw?: string) => {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^instagram\.com\//i.test(trimmed) || /^www\.instagram\.com\//i.test(trimmed)) return `https://${trimmed}`;
    if (/^@/.test(trimmed)) return `https://instagram.com/${trimmed.slice(1)}`;
    return `https://instagram.com/${trimmed}`;
  };
  const normalizedInstagramUrl = normalizeInstagramUrl(user.instagram_url);

  return (
    <>
      <div className="flex flex-col items-center md:flex-row gap-6 mb-6">
        {/* Profile Image - Smaller */}
        <div className="flex-shrink-0 flex justify-center md:justify-start mb-2">
          <div className="relative">
            <img
              src={user.image_url || "/default-avatar.jpg"}
              alt={user.name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-2 border-[#FFFBEb] shadow-sm"
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 w-full">
          <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-3 mb-4">
            <div className="text-center md:text-left">
              {/* Name and stats in one row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <h1 className="text-xl md:text-2xl font-semibold text-[#5C5537] flex items-center gap-1.5">
                  {user.name}
                  <VipBadge username={username} />
                </h1>
              </div>

              {/* Followers and Following stats - now clickable */}
              <div className="flex items-center gap-1 text-sm text-[#5C5537]/80 mt-3">
                <button
                  onClick={() => setIsFollowersModalOpen(true)}
                  className="text-center flex flex-row gap-1 hover:bg-[#5C5537]/5 px-2 py-1 rounded-md transition-colors"
                >
                  <div className="font-semibold text-[#5C5537]">{followerCount}</div>
                  <div className="text-xs text-[#5C5537]/60 mt-[3px]">Followers</div>
                </button>
                <button
                  onClick={() => setIsFollowingModalOpen(true)}
                  className="text-center flex flex-row gap-1 hover:bg-[#5C5537]/5 px-2 py-1 rounded-md transition-colors"
                >
                  <div className="font-semibold text-[#5C5537]">{stats.following}</div>
                  <div className="text-xs text-[#5C5537]/60 mt-[3px]">Following</div>
                </button>
              </div>

              {/* Country and social icons below */}
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-3">
                {/* Country */}
                {user.country && user.country.toLowerCase() !== 'none' && (
                  <div className="flex h-8 items-center gap-1 bg-[#5C5537]/5 px-2 py-1 rounded-md">
                    <MapPin className="w-3 h-3 text-[#5C5537]/70" />
                    <span className="text-sm text-[#5C5537]/70">
                      {user.country}
                    </span>
                  </div>
                )}

                {/* Social links */}
                <div className="flex flex-col gap-1">
                  {normalizedSpotifyUrl && (
                    <a
                      href={normalizedSpotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[10px] text-[#5C5537]/50 hover:text-[#5C5537]/80 transition-colors"
                    >
                      www.spotify.com
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {normalizedInstagramUrl && (
                    <a
                      href={normalizedInstagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[10px] text-[#5C5537]/50 hover:text-[#5C5537]/80 transition-colors"
                    >
                      www.instagram.com
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={handleEditClick}
                    className="bg-[#5C5537]/90 hover:bg-[#5C5537] text-white px-4 py-1.5 text-sm"
                  >
                    Edit Profile
                  </Button>
                  {isPrivateProfile && (
                    <Button
                      onClick={() => setIsFollowRequestsModalOpen(true)}
                      variant="outline"
                      className="relative text-[#5C5537] border-[#5C5537]/30 hover:bg-[#5C5537]/10 px-4 py-1.5 text-sm"
                    >
                      {/* <UserCheck className="w-3 h-3 mr-1" /> */}
                      Follow Requests
                      {pendingRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#5C5537] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleFollowClick}
                  disabled={isLoading}
                  className={`flex items-center gap-1 px-4 py-1.5 text-sm ${currentFollowStatus === 'following'
                      ? "bg-[#5C5537]/90 hover:bg-[#5C5537] text-white"
                      : currentFollowStatus === 'requested'
                        ? "bg-[#5C5537]/50 hover:bg-[#5C5537]/60 text-white cursor-not-allowed"
                        : "bg-[#5C5537]/90 hover:bg-[#5C5537] text-white"
                    }`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <>
                      {currentFollowStatus === 'following' ? (
                        <>
                          <Users className="w-3 h-3" />
                          Following
                        </>
                      ) : currentFollowStatus === 'requested' ? (
                        <>
                          <UserPlus className="w-3 h-3" />
                          Requested
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          {isPrivateProfile ? 'Request' : 'Follow'}
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={user.id}
        isOwnProfile={isOwnProfile}
      />

      {/* Following Modal */}
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        userId={user.id}
        isOwnProfile={isOwnProfile}
      />

      <FollowRequestsModal
        isOpen={isFollowRequestsModalOpen}
        onClose={() => setIsFollowRequestsModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="login"
      />
    </>
  );
};

export default ProfileHeader;