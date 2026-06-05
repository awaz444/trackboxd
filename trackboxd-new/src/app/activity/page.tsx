"use client";

import { useState, useEffect, useRef } from "react";
import Footer from "@/components/Footer";
import ActivityItem, { ActivityItem as ActivityItemType } from "@/components/activity/ActivityItem";
import SuggestedUsers from "@/components/activity/SuggestedUsers";
import PopularUsersSection from "@/components/home/PopularUsersSection";
import useUser from "@/hooks/useUser";
import { Music, Loader2 } from "lucide-react";

const PAGE_SIZE = 20;
const SPARSE_THRESHOLD = 10;

interface User {
  id: string;
  name: string;
  username: string;
  image_url?: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItemType[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSparse, setIsSparse] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const { user } = useUser();

  const fetchActivities = async (pageNum: number, append = false) => {
    if (!user) return;
    const setter = append ? setLoadingMore : setLoading;
    setter(true);
    try {
      const res = await fetch(`/api/activity?limit=${PAGE_SIZE}&page=${pageNum}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data: ActivityItemType[] = await res.json();

      setActivities((prev) => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);

      if (pageNum === 0 && data.length < SPARSE_THRESHOLD) {
        setIsSparse(true);
        fetchSparseContent();
      }
    } catch {
      // silently fail — show what we have
    } finally {
      setter(false);
    }
  };

  const fetchSparseContent = async () => {
    const [usersRes, popularRes] = await Promise.allSettled([
      fetch("/api/users/people-you-may-know").then((r) => r.json()),
      fetch("/api/users/popular").then((r) => r.json()),
    ]);
    if (usersRes.status === "fulfilled") setSuggestedUsers(usersRes.value || []);
    if (popularRes.status === "fulfilled") setPopularUsers(popularRes.value || []);
  };

  useEffect(() => {
    if (user) fetchActivities(0);
  }, [user]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]" />
          </div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#5C5537] mb-2">Activity</h1>
          <p className="text-[#5C5537]/70">
            See what you and your friends have been listening to
          </p>
        </div>

        {/* Sparse content: suggest people to follow */}
        {isSparse && (
          <div className="mb-8 space-y-6">
            {suggestedUsers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#5C5537] mb-4">People You May Know</h2>
                <SuggestedUsers users={suggestedUsers} />
              </div>
            )}
            {popularUsers.length > 0 && (
              <PopularUsersSection data={popularUsers} />
            )}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold text-[#5C5537] mb-6">Recent Activity</h2>
          <div className="space-y-0">
            {activities.length > 0 ? (
              <>
                {activities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isLast={index === activities.length - 1 && !hasMore}
                  />
                ))}
                {hasMore && (
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#5C5537]/30 text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading…
                        </>
                      ) : (
                        "Load more"
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-[#5C5537]">
                <Music className="w-12 h-12 mx-auto mb-2 text-[#5C5537]/70" />
                <p className="mb-3">No activity yet</p>
                <p className="text-sm text-[#5C5537]/60">
                  Follow people to see their reviews and annotations here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </div>
  );
}
