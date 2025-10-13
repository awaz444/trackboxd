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
      
      <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
        {following.map((user) => (
          <Link key={user.id} href={`/profile/${user.name}`}>
            <div className="flex-shrink-0 flex flex-col items-center cursor-pointer">
              <div className="relative">
                <img
                  src={user.image_url || "/default-avatar.jpg"}
                  alt={user.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#FFFBEb]"
                />
              </div>
                <div className="mt-2 text-sm font-medium text-[#5C5537] truncate max-w-[80px]">
                  {user.name}
                </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FollowingSection;