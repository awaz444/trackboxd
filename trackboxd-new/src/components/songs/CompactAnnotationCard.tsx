import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Annotation } from "@/app/songs/types";
import { Clock, Heart } from "lucide-react";
import useUser from "@/hooks/useUser";

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) {
        return secondsAgo === 1 ? "1 second ago" : `${secondsAgo} seconds ago`;
    }

    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) {
        return minutesAgo === 1 ? "1 minute ago" : `${minutesAgo} minutes ago`;
    }

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
        return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
    }

    const daysAgo = Math.floor(hoursAgo / 24);
    return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
};

const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface CompactAnnotationCardProps {
    annotation: Annotation;
}

const CompactAnnotationCard: React.FC<CompactAnnotationCardProps> = ({
    annotation,
}) => {
    const { user } = useUser();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState<number>((annotation as any).like_count || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const checkLikeStatus = async () => {
            const targetId = (annotation as any).id;
            if (!user || !targetId) {
                setInitialLoad(false);
                return;
            }
            try {
                const res = await fetch(`/api/likes/annotation?userId=${user.id}&annotationId=${targetId}`);
                if (!res.ok) throw new Error("Failed to fetch like status");
                const data = await res.json();
                setIsLiked(!!data.isLiked);
            } catch (_e) {
                // noop
            } finally {
                setInitialLoad(false);
            }
        };
        checkLikeStatus();
    }, [user, annotation]);

    const handleToggleLike = async () => {
        const targetId = (annotation as any).id;
        if (!user || !targetId || isLoading || initialLoad) return;
        setIsLoading(true);
        const next = !isLiked;
        const optimistic = next ? likeCount + 1 : Math.max(0, likeCount - 1);
        setIsLiked(next);
        setLikeCount(optimistic);
        try {
            const res = await fetch(`/api/likes/annotation`, {
                method: next ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, annotationId: targetId }),
            });
            if (!res.ok) throw new Error("Failed to toggle like");
        } catch (_e) {
            setIsLiked(!next);
            setLikeCount((annotation as any).like_count || 0);
        } finally {
            setIsLoading(false);
        }
    };
    const timeAgo = formatTimeAgo(annotation.created_at);
    const trackName = annotation.track_details?.name || "Unknown Track";
    const timestamp = formatDuration(annotation.timestamp || 0);

    const MAX_ARTISTS = 2;
    const artists = annotation.track_details?.artists || [];
    const artistNames =
        artists.length > MAX_ARTISTS
            ? `${artists
                  .slice(0, MAX_ARTISTS)
                  .map((a) => a.name)
                  .join(", ")} + ${artists.length - MAX_ARTISTS} more`
            : artists.map((a) => a.name).join(", ") || "Unknown Artist";

    return (
        <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 h-full">
            <div className="flex items-start gap-2 h-full">
                <div className="flex-1 min-w-0 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <img
                            src={annotation.users.image_url || "./default-avatar.jpg"}
                            alt={annotation.users.name}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = "./default-avatar.jpg";
                            }}
                        />
                        <div className="font-medium text-[#5C5537]">
                            <Link href={`/profile/${encodeURIComponent(annotation.users.name)}`} className="hover:underline">
                                {annotation.users.name}
                            </Link>
                        </div>
                        <div className="flex items-center text-[#5C5537]/70 text-xs">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{timestamp}</span>
                        </div>
                    </div>

                    <div className="mb-2">
                        <h3 className="font-semibold text-[#5C5537] text-sm">
                            {trackName}
                        </h3>
                        <p className="text-[#5C5537]/70 text-xs">
                            {artistNames}
                        </p>
                    </div>

                    {annotation.text && (
                        <p className="text-[#5C5537] text-sm line-clamp-2 mb-2 flex-1">
                            {annotation.text}
                        </p>
                    )}

                    <div className="flex justify-between items-center mt-auto">
                        <span className="text-xs text-[#5C5537]/70">
                            {timeAgo}
                        </span>
                        <div className="flex items-center gap-3">
                            {(annotation as any).id && (
                                <button
                                    onClick={handleToggleLike}
                                    disabled={isLoading || initialLoad || !user}
                                    className={`group flex items-center gap-1 text-xs focus:outline-none ${
                                        isLoading || initialLoad || !user
                                            ? "cursor-not-allowed text-[#5C5537]/40"
                                            : "cursor-pointer text-[#5C5537]/70 hover:text-[#5C5537]"
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${isLiked ? 'text-[#5C5537] fill-[#5C5537]' : ''}`} />
                                    <span className={`${isLiked ? 'text-[#5C5537] font-medium' : ''}`}>{likeCount}</span>
                                </button>
                            )}
                            <Link
                                href={`/songs/${annotation.track_id}`}
                                className="text-xs text-[#5C5537]/70 hover:text-[#5C5537]">
                                View track
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompactAnnotationCard;