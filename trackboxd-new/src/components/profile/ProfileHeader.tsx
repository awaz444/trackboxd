// ProfileHeader.tsx
import React from "react";
import { UserPlus, Users, MoreHorizontal, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    username: string;
    image_url?: string;
    country?: string;
  };
  stats: {
    followers: number;
    following: number;
    reviews: number;
    annotations: number;
  };
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  onFollowToggle?: () => void;
  onEditClick?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  isFollowing = false,
  isOwnProfile = false,
  onFollowToggle,
  onEditClick,
}) => {
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
            {/* {user.name && (
              <p className="text-lg text-[#5C5537]/70 mt-1">{user.name}</p>
            )} */}
            {user.country && (
              <p className="text-sm text-[#5C5537]/70 mt-1">📍 {user.country}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            {isOwnProfile ? (
              <Button 
                onClick={onEditClick}
                className="bg-[#5C5537] hover:bg-[#3E3725] text-white"
              >
                Edit Profile
              </Button>
            ) : (
              <Button 
                onClick={onFollowToggle}
                className={`flex items-center gap-2 ${isFollowing ? "text-[#FFFBEb] bg-[#5C5537] hover:bg-[#3E3725]" : "text-[#FFFBEb] bg-[#5C5537] hover:bg-[#3E3725]"}`}
              >
                {isFollowing ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            
            {/* <Button variant="outline" className="border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] hover:bg-[#5C5537]/10">
              <MoreHorizontal className="w-4 h-4" />
            </Button> */}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={<Users className="w-6 h-6 mx-auto" />} 
            value={stats.followers} 
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