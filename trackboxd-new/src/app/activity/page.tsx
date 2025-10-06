"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import ActivityItem, { ActivityItem as ActivityItemType } from "@/components/activity/ActivityItem";
import SuggestedUsers from "@/components/activity/SuggestedUsers";
import useUser from "@/hooks/useUser";
import { Music } from "lucide-react";

interface User {
  id: string;
  name: string;
  username: string;
  image_url?: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItemType[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const fetchSuggestedUsers = async () => {
    try {
      const res = await fetch("/api/users/recent");
      if (!res.ok) throw new Error("Failed to fetch suggested users");
      const data = await res.json();
      setSuggestedUsers(data);
    } catch (error) {
      console.error("Suggested users fetch error:", error);
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/activity");
        if (!res.ok) throw new Error("Failed to fetch activities");
        const data = await res.json();

        setActivities(data);
        
        // If there are fewer than 5 activities, fetch suggested users
        if (data.length < 5) {
          fetchSuggestedUsers();
        }
      } catch (error) {
        console.error("Activity fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchActivities();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  // Handler for when a user is successfully followed
  const handleFollowSuccess = () => {
    // No longer refreshing the suggested users list after a follow
    // This allows the 5 suggested users to stay until the page is manually refreshed
  };

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#5C5537] mb-2">
              Activity
            </h1>
            <p className="text-[#5C5537]/70">
              See what you and your friends have been listening to
            </p>
          </div>
        </div>

        {/* Show suggested users if there are fewer than 5 activities */}
        {activities.length < 5 && suggestedUsers.length > 0 && (
          <SuggestedUsers 
            users={suggestedUsers} 
            onFollowSuccess={handleFollowSuccess} 
          />
        )}

        <div>
          <h2 className="text-2xl font-semibold text-[#5C5537] mb-6">
            Recent Activity
          </h2>
          <div className="space-y-0">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === activities.length - 1}
                />
              ))
            ) : (
              <div className="text-center py-8 text-[#5C5537]">
                <Music className="w-12 h-12 mx-auto mb-2 text-[#5C5537]/70" />
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </div>
  );
}