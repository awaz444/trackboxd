import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Music, Album, Clock, Heart, Share2, Check } from "lucide-react";
import useUser from "@/hooks/useUser";

export interface ActivityItem {
  id: string;
  user: {
    id: string;
    name: string;
    image_url: string;
  };
  created_at: string;
  type: "review" | "annotation" | "like";
  title?: string;
  artist?: string;
  rating?: number;
  content?: string;
  track?: string;
  timestamp?: number;
  cover_url?: string;
  spotify_url?: string;
  // Added for linking and likes
  item_id?: string;
  item_type?: "track" | "album" | "playlist" | null;
  like_count?: number;
  target_id?: string; // review id or annotation id
  // For like events
  like_target_type?: "track" | "album" | "review" | "annotation";
  is_global?: boolean; // true when shown as fallback from non-followed users
}

interface ActivityItemProps {
  activity: ActivityItem;
  isLast?: boolean;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsAgo < 60) {
    return secondsAgo === 1 ? '1 second ago' : `${secondsAgo} seconds ago`;
  }
  
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`;
  }
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
  }
  
  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ActivityItem = ({ activity, isLast = false }: ActivityItemProps) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(activity.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Resolve the effective likeable type for this activity
  const effectiveLikeType =
    activity.type === "like"
      ? activity.like_target_type === "review"
        ? "review"
        : activity.like_target_type === "annotation"
        ? "annotation"
        : null
      : activity.type === "review"
      ? "review"
      : activity.type === "annotation"
      ? "annotation"
      : null;

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !activity.target_id || !effectiveLikeType) {
        setInitialLoad(false);
        return;
      }
      try {
        const url =
          effectiveLikeType === "review"
            ? `/api/likes/review?userId=${user.id}&reviewId=${activity.target_id}`
            : `/api/likes/annotation?userId=${user.id}&annotationId=${activity.target_id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setIsLiked(!!data.isLiked);
      } catch {
        // noop
      } finally {
        setInitialLoad(false);
      }
    };
    checkLikeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activity.target_id, effectiveLikeType]);

  const handleToggleLike = async () => {
    if (!user || !activity.target_id || !effectiveLikeType || isLoading || initialLoad) return;
    setIsLoading(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => next ? c + 1 : Math.max(0, c - 1));
    try {
      const endpoint =
        effectiveLikeType === "review" ? "/api/likes/review" : "/api/likes/annotation";
      const body =
        effectiveLikeType === "review"
          ? { userId: user.id, reviewId: activity.target_id }
          : { userId: user.id, annotationId: activity.target_id };
      const res = await fetch(endpoint, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(!next);
      setLikeCount((c) => next ? Math.max(0, c - 1) : c + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const [copied, setCopied] = useState(false);
  const timeAgo = formatTimeAgo(activity.created_at);
  const isAlbum = activity.type === "review" && activity.item_type === "album";

  const handleShare = async () => {
    const base = window.location.origin;
    const href = activity.type === "review"
      ? `${base}/reviews/${activity.target_id}`
      : activity.type === "annotation"
      ? `${base}/annotations/${activity.target_id}`
      : activity.item_type === "album"
      ? `${base}/albums/${activity.item_id}`
      : `${base}/songs/${activity.item_id}`;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(href, "_blank");
    }
  };
  const itemHref = activity.item_type === "album"
    ? `/albums/${activity.item_id}`
    : `/songs/${activity.item_id}`;

  const renderContent = () => {
    switch (activity.type) {
      case "review":
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <img 
                src={activity.user.image_url || './default-avatar.jpg'} 
                alt={activity.user.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-[#5C5537]/70">
                <Link href={`/profile/${encodeURIComponent(activity.user.name)}`} className="hover:underline">
                  {activity.user.name}
                </Link> reviewed
              </span>
              {isAlbum ? (
                <Album className="w-4 h-4 text-[#5C5537]" />
              ) : (
                <Music className="w-4 h-4 text-[#5C5537]" />
              )}
            </div>
            <div className="mb-3 flex items-start gap-3">
              {activity.cover_url ? (
                <img 
                  src={activity.cover_url} 
                  alt={activity.title}
                  className="w-12 h-12 rounded-md"
                />
              ) : (
                <div className="bg-[#5C5537]/10 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center">
                  <Music className="w-6 h-6 text-[#5C5537]/50" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-[#5C5537]">
                  <Link href={itemHref} className="hover:underline">
                    {activity.title}
                  </Link>
                </h4>
                <p className="text-sm text-[#5C5537]/70">
                  by {activity.artist}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="relative">
                  <div className="w-4 h-4 text-[#5C5537]/30">★</div>
                  <div
                    className="absolute top-0 left-0 w-5 h-5 text-[#FFBA00] overflow-hidden"
                    style={{
                      width: `${Math.max(0, Math.min(1, (activity.rating || 0) - star + 1)) * 100}%`,
                    }}>
                    ★
                  </div>
                </div>
              ))}
              <span className="text-sm text-[#5C5537] ml-1 mt-2">{activity.rating}</span>
            </div>
            {activity.content && (
              <p className="text-sm text-[#5C5537] mt-2 line-clamp-2">
                {activity.content}
              </p>
            )}
          </>
        );
      case "annotation":
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <img 
                src={activity.user.image_url || './default-avatar.jpg'} 
                alt={activity.user.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-[#5C5537]/70">
                <Link href={`/profile/${encodeURIComponent(activity.user.name)}`} className="hover:underline">
                  {activity.user.name}
                </Link> annotated
              </span>
              <Clock className="w-4 h-4 text-[#5C5537]" />
            </div>
            <div className="mb-2 flex items-start gap-3">
              {activity.cover_url ? (
                <img 
                  src={activity.cover_url} 
                  alt={activity.title}
                  className="w-12 h-12 rounded-md"
                />
              ) : (
                <div className="bg-[#5C5537]/10 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center">
                  <Music className="w-6 h-6 text-[#5C5537]/50" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-[#5C5537]">
                  <Link href={`/songs/${activity.item_id}`} className="hover:underline">
                    {activity.title}
                  </Link>
                </h4>
                <p className="text-sm text-[#5C5537]/70">
                  by {activity.artist} {activity.timestamp !== undefined && 
                    `· at ${formatDuration(activity.timestamp)}`}
                </p>
              </div>
            </div>
            {activity.content && (
              <p className="text-sm text-[#5C5537] mb-2">
                {activity.content}
              </p>
            )}
          </>
        );
      case "like": {
        const likeHref = activity.like_target_type === "album"
          ? `/albums/${activity.item_id}`
          : activity.like_target_type === "review"
          ? `/reviews/${activity.target_id}`
          : activity.like_target_type === "annotation"
          ? `/annotations/${activity.target_id}`
          : `/songs/${activity.item_id}`;
        const isLikeAlbum = activity.item_type === "album";
        return (
          <>
            {/* Header row — matches review/annotation style */}
            <div className="flex items-center gap-2 mb-3">
              <img
                src={activity.user.image_url || "./default-avatar.jpg"}
                alt={activity.user.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-[#5C5537]/70">
                <Link
                  href={`/profile/${encodeURIComponent(activity.user.name)}`}
                  className="hover:underline"
                >
                  {activity.user.name}
                </Link>{" "}liked
              </span>
              <Heart className="w-4 h-4 text-[#5C5537]" />
            </div>
            {/* Cover + item info row — same as review/annotation */}
            <div className="mb-2 flex items-start gap-3">
              {activity.cover_url ? (
                <img
                  src={activity.cover_url}
                  alt={activity.title}
                  className="w-12 h-12 rounded-md"
                />
              ) : (
                <div className="bg-[#5C5537]/10 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center">
                  {isLikeAlbum ? (
                    <Album className="w-6 h-6 text-[#5C5537]/50" />
                  ) : (
                    <Music className="w-6 h-6 text-[#5C5537]/50" />
                  )}
                </div>
              )}
              <div>
                <h4 className="font-medium text-[#5C5537]">
                  {activity.title ? (
                    <Link href={likeHref} className="hover:underline">
                      {activity.title}
                    </Link>
                  ) : (
                    <span>something</span>
                  )}
                </h4>
                {activity.artist && (
                  <p className="text-sm text-[#5C5537]/70">by {activity.artist}</p>
                )}
              </div>
            </div>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="relative pl-3">
      {/* Timeline line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#5C5537]/20"
        style={{ height: isLast ? "2.5rem" : "100%" }}
      />
      {/* Timeline dot */}
      <div className="absolute left-4/5 top-0 transform -translate-x-4 w-3 h-3 rounded-full bg-[#5C5537] border-2 border-[#FFFBEb]" />

      <div className="p-4 space-y-1">
        {renderContent()}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5C5537]/70">{timeAgo}</span>
          {/* No actions on "like" type events */}
          {activity.type !== "like" && (
            <div className="flex items-center gap-3">
              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-[#5C5537]/50 hover:text-[#5C5537] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
              {/* Like — only functional for review/annotation targets */}
              <button
                onClick={handleToggleLike}
                disabled={isLoading || initialLoad || !user || !effectiveLikeType}
                className={`group flex items-center gap-1 text-sm focus:outline-none ${
                  isLoading || initialLoad || !user || !effectiveLikeType
                    ? "cursor-not-allowed text-[#5C5537]/40"
                    : "cursor-pointer text-[#5C5537]/70 hover:text-[#5C5537]"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    isLiked ? "text-[#5C5537] fill-[#5C5537]" : ""
                  }`}
                />
                <span className={isLiked ? "text-[#5C5537] font-medium" : ""}>
                  {likeCount}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;