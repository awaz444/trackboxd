"use client";

import Link from "next/link";
import ActivityItem, { ActivityItem as ActivityItemType } from "@/components/activity/ActivityItem";
import HomeSectionHeader from "./HomeSectionHeader";
import GlobalActivityGrid from "@/components/activity/GlobalActivityGrid";
import type { GlobalActivityItem } from "@/lib/global-activity";

interface Props {
  data: ActivityItemType[];
  fallbackGlobalItems?: GlobalActivityItem[];
  fallbackCountries?: Array<{ code: string; name: string }>;
}

export default function RecentFriendsActivity({
  data,
  fallbackGlobalItems = [],
  fallbackCountries = [],
}: Props) {
  const hasFriends = data.length > 0;
  const hasFallback = !hasFriends && fallbackGlobalItems.length > 0;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title={hasFriends ? "Recent Activity" : "What's happening now"}
        subtitle={
          hasFriends
            ? "What your friends have been up to"
            : hasFallback
              ? "Nobody you follow has posted yet — here's the rest of Trackboxd"
              : "What your friends have been up to"
        }
        viewMoreHref="/activity"
      />
      {hasFriends ? (
        <div className="space-y-0">
          {data.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === data.length - 1}
            />
          ))}
        </div>
      ) : hasFallback ? (
        <div className="space-y-4">
          <GlobalActivityGrid
            items={fallbackGlobalItems}
            countries={fallbackCountries}
            maxItems={6}
          />
          <div className="text-center">
            <Link
              href="/activity"
              className="text-sm font-medium text-[#5C5537] hover:underline"
            >
              Discover people to follow →
            </Link>
          </div>
        </div>
      ) : (
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
      )}
    </section>
  );
}
