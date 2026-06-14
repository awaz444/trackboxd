"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import useUser from "@/hooks/useUser";
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
  likes?: Record<string, boolean>;
}

const formatTimestamp = (seconds: number) => {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const AnnotationRow = ({
  ann,
  initialIsLiked,
}: {
  ann: PopularAnnotation;
  initialIsLiked: boolean;
}) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(ann.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setIsLiked(initialIsLiked), [initialIsLiked]);
  useEffect(() => setLikeCount(ann.like_count || 0), [ann.like_count]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || isLoading) return;
    setIsLoading(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      const res = await fetch("/api/likes/annotation", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, annotationId: ann.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(!next);
      setLikeCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
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
        {/* Like */}
        <button
          onClick={handleToggleLike}
          disabled={isLoading || !user}
          className={`flex items-center gap-1 text-xs flex-shrink-0 self-start focus:outline-none ${
            isLoading || !user
              ? "cursor-not-allowed text-[#5C5537]/40"
              : "cursor-pointer text-[#5C5537]/60 hover:text-[#5C5537]"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-[#5C5537] text-[#5C5537]" : ""}`} />
          <span className={isLiked ? "text-[#5C5537] font-medium" : ""}>{likeCount}</span>
        </button>
      </div>
    </Link>
  );
};

export default function PopularAnnotationsSection({ data, likes = {} }: Props) {
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
          <AnnotationRow key={ann.id} ann={ann} initialIsLiked={likes[ann.id] || false} />
        ))}
      </div>
    </section>
  );
}
