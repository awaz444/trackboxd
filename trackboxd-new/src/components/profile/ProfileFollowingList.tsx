import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfilePagination from "@/components/profile/ProfilePagination";
import type { ProfileFollowingPage } from "@/lib/profile-service";

export default function ProfileFollowingList({ username, data }: { username: string; data: ProfileFollowingPage }) {
  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/profile/${username}`}
          className="inline-flex items-center gap-1 text-sm text-[#5C5537]/70 hover:text-[#5C5537] mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {data.user.name}&apos;s profile
        </Link>
        <h1 className="text-3xl font-bold text-[#5C5537] mb-1">People {data.user.name} follows</h1>

        {data.hidden ? (
          <p className="text-[#5C5537]/70 mt-6">This account is private.</p>
        ) : (
          <>
            <p className="text-[#5C5537]/70 mb-6">{data.total} following</p>
            {data.items.length === 0 ? (
              <p className="text-[#5C5537]/70">Not following anyone yet.</p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.items.map((u) => (
                  <li key={u.id}>
                    <Link href={`/profile/${u.name}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 hover:bg-white">
                      <img
                        src={u.image_url || "/default-avatar.jpg"}
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span className="font-medium text-[#5C5537] truncate">{u.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <ProfilePagination base={`/profile/${username}/following`} page={data.page} totalPages={data.totalPages} />
          </>
        )}
      </div>
    </div>
  );
}
