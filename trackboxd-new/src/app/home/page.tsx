"use client";

import { useState, useEffect, useCallback } from "react";
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
import JournalsPromoModal from "@/components/home/JournalsPromoModal";

const JOURNALS_PROMO_KEY = "trackboxd_journals_promo_seen";

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
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [reviewLikes, setReviewLikes] = useState<Record<string, boolean>>({});
  const [annotationLikes, setAnnotationLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showJournalsPromo, setShowJournalsPromo] = useState(false);

  const fetchLikeStatuses = useCallback(
    async (items: { id: string; type: string }[]) => {
      if (!user) return;
      const uniqueItems = Array.from(
        new Map(items.map((item) => [item.id, item])).values()
      );
      const statuses = await Promise.all(
        uniqueItems.map((item) => {
          const endpoint = item.type === "album" ? "album" : "track";
          const queryParam = item.type === "album" ? "albumId" : "trackId";
          return fetch(
            `/api/likes/${endpoint}?userId=${user.id}&${queryParam}=${item.id}`
          )
            .then((r) => r.json())
            .then((d) => ({ id: item.id, isLiked: d.isLiked }))
            .catch(() => ({ id: item.id, isLiked: false }));
        })
      );
      setLikes((prev) => {
        const next = { ...prev };
        statuses.forEach(({ id, isLiked }) => {
          next[id] = isLiked;
        });
        return next;
      });
    },
    [user]
  );

  // Like status for reviews/annotations (e.g. Popular Reviews/Annotations sections)
  const fetchTargetLikeStatuses = useCallback(
    async (ids: string[], type: "review" | "annotation") => {
      if (!user || ids.length === 0) return {} as Record<string, boolean>;
      const idParam = type === "review" ? "reviewId" : "annotationId";
      const statuses = await Promise.all(
        ids.map((id) =>
          fetch(`/api/likes/${type}?userId=${user.id}&${idParam}=${id}`)
            .then((r) => r.json())
            .then((d) => ({ id, isLiked: !!d.isLiked }))
            .catch(() => ({ id, isLiked: false }))
        )
      );
      return Object.fromEntries(statuses.map((s) => [s.id, s.isLiked])) as Record<string, boolean>;
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(JOURNALS_PROMO_KEY)) return;

    const timer = setTimeout(() => setShowJournalsPromo(true), 1200);
    return () => clearTimeout(timer);
  }, [user]);

  const dismissJournalsPromo = () => {
    setShowJournalsPromo(false);
    window.localStorage.setItem(JOURNALS_PROMO_KEY, "1");
  };

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

        let popItems: any[] = [];
        let recItems: any[] = [];
        let newItems: any[] = [];

        if (newRes.status === "fulfilled") {
          newItems = newRes.value || [];
          setNewContent(newItems);
        }
        if (popularRes.status === "fulfilled") {
          popItems = popularRes.value || [];
          setPopularItems(popItems);
        }
        if (reviewsRes.status === "fulfilled") {
          const reviews = reviewsRes.value || [];
          setPopularReviews(reviews);
          fetchTargetLikeStatuses(reviews.map((r: any) => r.id), "review").then(setReviewLikes);
        }
        if (annotationsRes.status === "fulfilled") {
          const annotations = annotationsRes.value || [];
          setPopularAnnotations(annotations);
          fetchTargetLikeStatuses(annotations.map((a: any) => a.id), "annotation").then(setAnnotationLikes);
        }
        if (activityRes.status === "fulfilled") setFriendsActivity(activityRes.value || []);
        if (recommendedRes.status === "fulfilled") {
          recItems = recommendedRes.value || [];
          setRecommended(recItems);
        }
        if (peopleRes.status === "fulfilled") setPeopleYouMayKnow(peopleRes.value || []);
        if (usersRes.status === "fulfilled") setPopularUsers(usersRes.value || []);

        const allItems = [
          ...popItems,
          ...recItems,
          ...newItems.map((r) => ({ id: r.item_id, type: r.item_type })),
        ];
        if (allItems.length > 0) {
          fetchLikeStatuses(allItems);
        }
      } catch (err) {
        console.error("Home page fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, fetchLikeStatuses, fetchTargetLikeStatuses]);

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
        <NewOnTrackboxd data={newContent} likes={likes} />

        {/* Popular on Trackboxd (items) */}
        <PopularOnTrackboxd data={popularItems} likes={likes} />

        {/* Popular Reviews This Week */}
        <PopularReviewsSection data={popularReviews} likes={reviewLikes} />

        {/* Popular Annotations This Week */}
        <PopularAnnotationsSection data={popularAnnotations} likes={annotationLikes} />

        {/* Recent Activity */}
        <RecentFriendsActivity data={friendsActivity} />

        {/* Recommended for You */}
        <RecommendedForYou
          data={recommended}
          fallbackData={popularItems}
          likes={likes}
        />

        {/* People You May Know */}
        <PeopleYouMayKnow data={peopleYouMayKnow} />

        {/* Popular Users */}
        <PopularUsersSection data={popularUsers} />
      </div>
      <Footer variant="light" />

      {showJournalsPromo && (
        <JournalsPromoModal onClose={dismissJournalsPromo} />
      )}
    </div>
  );
}
