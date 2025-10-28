// FollowingSection.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FollowingUser {
  id: string;
  username: string;
  name: string;
  image_url?: string;
}

interface FollowingSectionProps {
  following: FollowingUser[];
  isOwnProfile?: boolean;
}

const FollowingSection: React.FC<FollowingSectionProps> = ({
  following,
  isOwnProfile = false,
}) => {
  // Don't render the section if there are no following users
  if (!following || following.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#5C5537]">people i follow...</h2>
        {isOwnProfile && (
          <Button variant="link" className="text-[#5C5537] hover:text-[#3E3725] p-0">
            View All
          </Button>
        )}
      </div>
      
      {/* Horizontal scrollable container with proper spacing */}
      <div className="relative">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 px-1 scroll-smooth">
          {following.map((user) => (
            <Link key={user.id} href={`/profile/${user.name}`}>
              <div className="flex-shrink-0 flex flex-col items-center cursor-pointer min-w-[80px] sm:min-w-[90px]">
                <div className="relative">
                  <img
                    src={user.image_url || "/default-avatar.jpg"}
                    alt={user.username}
                    className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full object-cover border-2 border-[#FFFBEb] shadow-sm hover:shadow-md transition-shadow duration-200"
                  />
                </div>
                <div className="mt-2 text-xs sm:text-sm font-medium text-[#5C5537] truncate max-w-[80px] sm:max-w-[90px] text-center">
                  {user.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Gradient fade effect on the right edge */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default FollowingSection;