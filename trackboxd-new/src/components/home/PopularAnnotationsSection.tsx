"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";
import { VipBadge } from "@/components/VipBadge";

interface PopularAnnotation {
  id: string;
  text: string;
  timestamp: number;
  like_count: number;
  created_at: string;
  track_id: string;
  track_name: string;
  artist: string;
  cover_url: string;
  user: { id: string; name: string; image_url?: string; username?: string };
}

interface Props {
  data: PopularAnnotation[];
}

const formatTimestamp = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function PopularAnnotationsSection({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="Popular Annotations This Week"
        subtitle="Most liked annotations this week"
        viewMoreHref="/tracks"
      />
      <div className="space-y-3">
        {data.map((ann) => (
          <Link
            key={ann.id}
            href={`/annotations/${ann.id}`}
            className="block bg-[#FFFBEb] border border-[#5C5537]/20 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Cover */}
              <img
                src={ann.cover_url || "/default-album.jpg"}
                alt={ann.track_name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = "/default-album.jpg";
                }}
              />
              <div className="min-w-0 flex-1">
                {/* Track info + timestamp */}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#5C5537]/60 truncate">
                    {ann.artist} — {ann.track_name}
                  </p>
                  <span className="text-xs bg-[#5C5537]/10 text-[#5C5537] px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                    {formatTimestamp(ann.timestamp)}
                  </span>
                </div>
                {/* User */}
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <img
                    src={ann.user.image_url || "/default-avatar.jpg"}
                    alt={ann.user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-[#5C5537] inline-flex items-center gap-1">
                    {ann.user.name}
                    <VipBadge username={ann.user.name} />
                  </span>
                </div>
                {/* Annotation text */}
                <p className="text-sm text-[#5C5537]/80 line-clamp-2">
                  {ann.text}
                </p>
              </div>
              {/* Like count */}
              <div className="flex items-center gap-1 text-[#5C5537]/60 text-xs flex-shrink-0 self-start">
                <Heart className="w-3.5 h-3.5" />
                <span>{ann.like_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
