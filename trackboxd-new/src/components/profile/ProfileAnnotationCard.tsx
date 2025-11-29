"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import ContentModal from "./ContentModal";
import { useSession } from "next-auth/react";

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
    text?: string;
  };
}

const ProfileAnnotationCard: React.FC<ProfileAnnotationCardProps> = ({ annotation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user) {
        setInitialLoad(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/like/annotation?userId=${user.id}&annotationId=${annotation.id}`
        );
        
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

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || !user) return;

    setIsLoading(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    try {
      const response = await fetch("/api/like/annotation", {
        method: newLikedState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          annotationId: annotation.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }
    } catch (error) {
      console.error("Like operation failed:", error);
      setIsLiked(!newLikedState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-[#5C5537]/70">
            {annotation.timestamp}
          </div>
        </div>
        <div className="mb-1 text-sm text-[#5C5537]">
          <span className="font-semibold">
            {annotation.track.title}
          </span>
          <span className="text-[#5C5537]/70">
            {" "}
            by {annotation.track.artist}
          </span>
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

          <button
            onClick={handleLikeClick}
            disabled={isLoading || !user}
            className={`flex items-center gap-1 text-xs transition-colors ${
              isLiked ? "text-[#5C5537]" : "text-[#5C5537]/40 hover:text-[#5C5537]/70"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-[#5C5537]" : ""}`} />
          </button>
        </div>
      </div>

      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Annotation"
      >
        <div className="space-y-4">
          <div className="border-b border-[#5C5537]/10 pb-4">
            <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-5 h-5 text-[#5C5537]" />
                <h3 className="text-xl font-bold text-[#5C5537]">{annotation.track.title}</h3>
            </div>
            <p className="text-[#5C5537]/70">{annotation.track.artist}</p>
          </div>

          <div className="text-[#5C5537] text-base leading-relaxed whitespace-pre-wrap">
            {annotation.text || "No annotation text."}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#5C5537]/10">
            <div className="text-sm text-[#5C5537]/60">
                Posted {annotation.timestamp}
            </div>
            <button
              onClick={handleLikeClick}
              disabled={isLoading || !user}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                isLiked 
                  ? "bg-[#5C5537]/10 text-[#5C5537]" 
                  : "hover:bg-[#5C5537]/5 text-[#5C5537]/70"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-[#5C5537]" : ""}`} />
              <span className="font-medium">{isLiked ? "Liked" : "Like"}</span>
            </button>
          </div>
        </div>
      </ContentModal>
    </>
  );
};

export default ProfileAnnotationCard;
