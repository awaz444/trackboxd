"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import NewOnTrackboxd from "@/components/home/NewOnTrackboxd";
import PopularOnTrackboxd from "@/components/home/PopularOnTrackboxd";
import PopularReviewsSection from "@/components/home/PopularReviewsSection";
import PopularAnnotationsSection from "@/components/home/PopularAnnotationsSection";
import RecentFriendsActivity from "@/components/home/RecentFriendsActivity";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import PeopleYouMayKnow from "@/components/home/PeopleYouMayKnow";
import PopularUsersSection from "@/components/home/PopularUsersSection";

export default function HomePage() {
  const { user } = useUser();

  const [newContent, setNewContent] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [popularReviews, setPopularReviews] = useState<any[]>([]);
  const [popularAnnotations, setPopularAnnotations] = useState<any[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<any[]>([]);
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          newRes,
          popularRes,
          reviewsRes,
          annotationsRes,
          activityRes,
          recommendedRes,
          peopleRes,
          usersRes,
        ] = await Promise.allSettled([
          fetch("/api/home/new-on-trackboxd").then((r) => r.json()),
          fetch("/api/home/popular-on-trackboxd").then((r) => r.json()),
          fetch("/api/home/popular-reviews").then((r) => r.json()),
          fetch("/api/home/popular-annotations").then((r) => r.json()),
          fetch("/api/activity?limit=5").then((r) => r.json()),
          fetch("/api/home/recommended-for-you").then((r) => r.json()),
          fetch("/api/users/people-you-may-know").then((r) => r.json()),
          fetch("/api/users/popular").then((r) => r.json()),
        ]);

        if (newRes.status === "fulfilled") setNewContent(newRes.value || []);
        if (popularRes.status === "fulfilled") setPopularItems(popularRes.value || []);
        if (reviewsRes.status === "fulfilled") setPopularReviews(reviewsRes.value || []);
        if (annotationsRes.status === "fulfilled") setPopularAnnotations(annotationsRes.value || []);
        if (activityRes.status === "fulfilled") setFriendsActivity(activityRes.value || []);
        if (recommendedRes.status === "fulfilled") setRecommended(recommendedRes.value || []);
        if (peopleRes.status === "fulfilled") setPeopleYouMayKnow(peopleRes.value || []);
        if (usersRes.status === "fulfilled") setPopularUsers(usersRes.value || []);
      } catch (err) {
        console.error("Home page fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

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
        {/* New on Trackboxd */}
        <NewOnTrackboxd data={newContent} />

        {/* Popular on Trackboxd (items) */}
        <PopularOnTrackboxd data={popularItems} />

        {/* Popular Reviews This Week */}
        <PopularReviewsSection data={popularReviews} />

        {/* Popular Annotations This Week */}
        <PopularAnnotationsSection data={popularAnnotations} />

        {/* Recent Activity */}
        <RecentFriendsActivity data={friendsActivity} />

        {/* Recommended for You */}
        <RecommendedForYou
          data={recommended}
          fallbackData={popularItems}
        />

        {/* People You May Know */}
        <PeopleYouMayKnow data={peopleYouMayKnow} />

        {/* Popular Users */}
        <PopularUsersSection data={popularUsers} />
      </div>
      <Footer variant="light" />
    </div>
  );
}
