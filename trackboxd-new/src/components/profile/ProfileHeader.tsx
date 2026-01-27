// ProfileHeader.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, MapPin, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import FollowRequestsModal from "./FollowRequestsModal";
import AuthModal from "@/components/AuthModal";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();

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
                <h1 className="text-xl md:text-2xl font-semibold text-[#5C5537]">
                  {user.name}
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

                {/* Social icons */}
                <div className="flex items-center gap-2">
                  {normalizedSpotifyUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537] hover:text-white transition-colors bg-[#FFFBEb]"
                    >
                      <a href={normalizedSpotifyUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Spotify profile">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-2-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                      </a>
                    </Button>
                  )}
                  {normalizedInstagramUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537] hover:text-white transition-colors bg-[#FFFBEb]"
                    >
                      <a href={normalizedInstagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Instagram profile">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3zm5 3.5A5.5 5.5 0 106 13a5.5 5.5 0 006-5.5zm0 2A3.5 3.5 0 118.5 13 3.5 3.5 0 0112 9.5zM17.5 6A1.5 1.5 0 1116 7.5 1.5 1.5 0 0117.5 6z" />
                        </svg>
                      </a>
                    </Button>
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