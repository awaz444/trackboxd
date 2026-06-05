"use client";

import Link from "next/link";
import ActivityItem, { ActivityItem as ActivityItemType } from "@/components/activity/ActivityItem";
import HomeSectionHeader from "./HomeSectionHeader";

interface Props {
  data: ActivityItemType[];
}

export default function RecentFriendsActivity({ data }: Props) {
  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="Recent Activity"
        subtitle="What your friends have been up to"
        viewMoreHref="/activity"
      />
      {data.length === 0 ? (
        <div className="bg-[#5C5537]/5 rounded-xl p-8 text-center">
          <p className="text-[#5C5537]/70 text-sm mb-3">
            No recent activity from people you follow.
          </p>
          <Link
            href="/activity"
            className="text-sm font-medium text-[#5C5537] hover:underline"
          >
            Discover people to follow →
          </Link>
        </div>
      ) : (
        <div className="space-y-0">
          {data.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === data.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
