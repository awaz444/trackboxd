// ProfileHeader.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, MoreHorizontal, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/useFollow";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    username: string;
    image_url?: string;
    country?: string;
    created_at: string;
    spotify_url?: string;
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
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  isOwnProfile = false,
  username,
  initialIsFollowing = false,
}) => {
  const router = useRouter();
  
  const { isFollowing, followerCount, isLoading, toggleFollow } = useFollow({
    userId: user.id,
    initialIsFollowing,
    initialFollowerCount: stats.followers,
  });
  
  const handleEditClick = () => {
    router.push(`/profile/${username}/edit`);
  };

  const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
    <div className="p-4 text-center">
      <div className="flex justify-center mb-2 text-[#5C5537]">
        {icon}
      </div>
      <div className="text-2xl font-bold text-[#5C5537]">{value}</div>
      <div className="text-sm text-[#5C5537]/70">{label}</div>
    </div>
  );

  return (
    <div className="flex flex-col items-center md:flex-row gap-8 mb-8">
      {/* Profile Image */}
      <div className="flex-shrink-0 flex justify-center md:justify-start">
        <div className="relative">
          <img 
            src={user.image_url || "/default-avatar.jpg"} 
            alt={user.name} 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#FFFBEb] shadow-lg"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex-1 w-full">
        <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4 mb-6">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-[#5C5537]">@{user.name}</h1>
              {user.country && (
                <p className="text-sm text-[#5C5537]/70 mt-1">📍 {user.country}</p>
              )}
              {user.spotify_url && (
                <a 
                  href={user.spotify_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#1DB954] hover:text-[#1ed760] mt-1 block"
                >
                  🎵 Spotify Profile
                </a>
              )}
            </div>
          
          <div className="flex gap-3">
            {isOwnProfile ? (
              <Button 
                onClick={handleEditClick}
                className="bg-[#5C5537] hover:bg-[#3E3725] text-white"
              >
                Edit Profile
              </Button>
            ) : (
              <Button 
                onClick={toggleFollow}
                disabled={isLoading}
                className={`flex items-center gap-2 ${isFollowing ? "text-[#FFFBEb] bg-[#5C5537] hover:bg-[#3E3725]" : "text-[#FFFBEb] bg-[#5C5537] hover:bg-[#3E3725]"}`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {isFollowing ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? "Following" : "Follow"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={<Users className="w-6 h-6 mx-auto" />} 
            value={followerCount} 
            label="Followers" 
          />
          <StatCard 
            icon={<Users className="w-6 h-6 mx-auto" />} 
            value={stats.following} 
            label="Following" 
          />
          <StatCard 
            icon={<Star className="w-6 h-6 mx-auto" />} 
            value={stats.reviews} 
            label="Reviews" 
          />
          <StatCard 
            icon={<MessageCircle className="w-6 h-6 mx-auto" />} 
            value={stats.annotations} 
            label="Annotations" 
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;