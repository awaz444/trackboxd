import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import { VipBadge } from "@/components/VipBadge";
import ActivityAvatar from "@/components/activity/ActivityAvatar";
import type { GlobalActivityItem } from "@/lib/global-activity";

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return s === 1 ? "1 second ago" : `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? "1 minute ago" : `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

function mmss(sec: number) {
  const t = Math.floor(sec);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}

function ActivityCard({ item }: { item: GlobalActivityItem }) {
  const userImage = item.user.image_url || "/default-avatar.jpg";
  return (
    <div className="h-full flex flex-col bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-1 items-start gap-2">
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ActivityAvatar src={userImage} alt={item.user.name} />
            <div className="font-medium text-[#5C5537] flex items-center gap-1 min-w-0">
              <Link
                href={`/profile/${encodeURIComponent(item.user.name)}`}
                className="hover:underline truncate"
              >
                {item.user.name}
              </Link>
              <VipBadge username={item.user.name} />
            </div>
            {item.kind === "review" && item.rating !== null ? (
              <RatingStars rating={item.rating} />
            ) : item.timestamp !== null ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#5C5537]/70">
                <Clock className="w-3 h-3" /> {mmss(item.timestamp)}
              </span>
            ) : null}
          </div>

          <div className="mb-2">
            <h3 className="font-semibold text-[#5C5537] text-sm truncate">
              {item.track.name}
            </h3>
            <p className="text-[#5C5537]/70 text-xs truncate">{item.track.artist}</p>
          </div>

          {/* Always reserve two lines so cards with and without text match in height */}
          <p className="text-[#5C5537] text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
            {item.text ? <>&ldquo;{item.text}&rdquo;</> : null}
          </p>

          <div className="flex justify-between items-center mt-auto">
            <span className="text-xs text-[#5C5537]/70">{timeAgo(item.created_at)}</span>
            <Link
              href={item.href}
              className="text-xs text-[#5C5537]/70 hover:text-[#5C5537]"
            >
              {item.kind === "annotation" ? "View annotation" : "View track"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  items: GlobalActivityItem[];
  maxItems?: number;
  hiddenBreakpointIndex?: number;
}

export default function GlobalActivityGrid({
  items,
  maxItems,
  hiddenBreakpointIndex = 6,
}: Props) {
  const visible = typeof maxItems === "number" ? items.slice(0, maxItems) : items;
  if (visible.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {visible.map((item, i) => (
        <div key={`${item.kind}-${item.id}`} className={i >= hiddenBreakpointIndex ? "hidden sm:block h-full" : "h-full"}>
          <ActivityCard item={item} />
        </div>
      ))}
    </div>
  );
}
