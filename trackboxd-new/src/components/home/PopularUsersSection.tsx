"use client";

import Link from "next/link";
import HomeSectionHeader from "./HomeSectionHeader";
import { useFollow } from "@/hooks/useFollow";
import { Loader2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VipBadge } from "@/components/VipBadge";

interface PopularUser {
  id: string;
  name: string;
  username: string;
  image_url?: string;
  followers: number;
  review_count: number;
  annotation_count: number;
  is_following: boolean;
}

function UserRow({ user }: { user: PopularUser }) {
  const { followStatus, isLoading, toggleFollow } = useFollow({
    userId: user.id,
    initialFollowStatus: user.is_following ? "following" : "not_following",
    initialFollowerCount: user.followers,
  });

  return (
    <div className="flex items-center justify-between p-3 hover:bg-[#5C5537]/5 rounded-lg transition-colors">
      <Link
        href={`/profile/${user.username || user.name}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {user.image_url ? (
          <img
            src={user.image_url}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#5C5537]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#5C5537] font-bold text-sm">
              {user.name[0]}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-[#5C5537] truncate flex items-center gap-1">
            {user.name}
            <VipBadge username={user.name} />
          </p>
          <p className="text-xs text-[#5C5537]/60">
            {user.followers} follower{user.followers !== 1 ? "s" : ""} ·{" "}
            {user.review_count} review{user.review_count !== 1 ? "s" : ""}
          </p>
        </div>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFollow}
        disabled={isLoading}
        className={`ml-3 text-[#5C5537] border-[#5C5537]/30 hover:bg-[#5C5537]/10 flex-shrink-0 ${
          followStatus === "following" ? "bg-[#5C5537]/20" : ""
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : followStatus === "following" ? (
          <Users className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        <span className="ml-1">
          {followStatus === "following" ? "Following" : "Follow"}
        </span>
      </Button>
    </div>
  );
}

interface Props {
  data: PopularUser[];
}

export default function PopularUsersSection({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="Popular on Trackboxd"
        subtitle="Top users by community engagement"
      />
      <div className="bg-[#5C5537]/5 rounded-xl p-2">
        {data.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>
    </section>
  );
}
