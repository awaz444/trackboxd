"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Clock, X, Share2, ExternalLink } from "lucide-react";
import ShareSheet from "@/components/share/ShareSheet";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileAnnotationCardProps {
  annotation: {
    id: string;
    type: "annotation";
    track: {
      id: string;
      title: string;
      artist: string;
      cover_url?: string;
    };
    timestamp: string;
    like_count?: number;
    text?: string;
    is_public?: boolean;
  };
}

const ProfileAnnotationCard: React.FC<ProfileAnnotationCardProps> = ({ annotation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(annotation.like_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user) { setInitialLoad(false); return; }
      try {
        const response = await fetch(`/api/likes/annotation?userId=${user.id}&annotationId=${annotation.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked);
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchLikeStatus();
  }, [user, annotation.id]);

  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || !user) return;
    setIsLoading(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    try {
      const response = await fetch("/api/likes/annotation", {
        method: newLikedState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, annotationId: annotation.id }),
      });
      if (!response.ok) throw new Error("Failed to update like status");
    } catch (error) {
      console.error("Like operation failed:", error);
      setIsLiked(!newLikedState);
      setLikeCount(annotation.like_count || 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-[#5C5537]">at {annotation.timestamp}</div>
        </div>
        <div className="mb-1 text-sm text-[#5C5537] flex items-center min-w-0">
          <div className="flex-1 min-w-0 truncate">
            <span className="font-semibold">{annotation.track.title}</span>
            <span className="text-[#5C5537]/70"> by {annotation.track.artist}</span>
          </div>
        </div>
        {annotation.text && (
          <div className="text-sm text-[#5C5537]/90 line-clamp-3 group-hover:text-[#5C5537] transition-colors">
            {annotation.text}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <Link
            href={`/songs/${annotation.track.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
          >
            View track
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLikeClick}
              disabled={isLoading || !user}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked ? "text-[#5C5537]" : "text-[#5C5537]/40 hover:text-[#5C5537]/70"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
              {likeCount > 0 && <span className={isLiked ? "font-medium" : ""}>{likeCount}</span>}
            </button>
            {(annotation.is_public !== false) && (
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="text-[#5C5537]/40 hover:text-[#5C5537] transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Improved modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#FFFBEb] rounded-xl w-full max-w-lg border border-[#5C5537]/20 shadow-xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#5C5537]/10 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#5C5537]">Annotation</span>
                <Link
                  href={`/annotations/${annotation.id}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#5C5537]/35 hover:text-[#5C5537] transition-colors"
                  aria-label="Open annotation page"
                >
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5C5537]/60 hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-5 space-y-5">
              {/* Track info with cover art */}
              <div className="flex gap-4 items-start">
                {annotation.track.cover_url && (
                  <img
                    src={annotation.track.cover_url}
                    alt={annotation.track.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#5C5537] text-lg leading-tight">{annotation.track.title}</h3>
                  <p className="text-[#5C5537]/70 text-sm mt-0.5">{annotation.track.artist}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="w-3.5 h-3.5 text-[#5C5537]/60 flex-shrink-0" />
                    <span className="text-xs text-[#5C5537]/60">at {annotation.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Annotation text */}
              <div className="border-t border-[#5C5537]/10 pt-4 text-[#5C5537] text-sm leading-relaxed whitespace-pre-wrap">
                {annotation.text || <span className="italic text-[#5C5537]/50">No annotation text.</span>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-[#5C5537]/10 px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-[#5C5537]/60">at {annotation.timestamp} in the track</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLikeClick}
                  disabled={isLoading || !user}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isLiked ? "text-[#5C5537]" : "text-[#5C5537]/50 hover:text-[#5C5537]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
                  <span className={isLiked ? "font-medium" : ""}>{likeCount > 0 ? likeCount : ""}</span>
                  <span className="text-xs">{isLiked ? "Liked" : "Like"}</span>
                </button>
                <Link
                  href={`/songs/${annotation.track.id}`}
                  className="text-xs text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
                >
                  View track
                </Link>
                {(annotation.is_public !== false) && (
                  <button
                    onClick={() => setShareOpen(true)}
                    className="text-[#5C5537]/50 hover:text-[#5C5537] transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareSheet type="annotation" id={annotation.id} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
};

export default ProfileAnnotationCard;
