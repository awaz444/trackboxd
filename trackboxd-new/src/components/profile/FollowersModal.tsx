"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Follower {
    id: string;
    username: string;
    name: string;
    image_url?: string;
}

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    isOwnProfile: boolean;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
    isOpen,
    onClose,
    userId,
    isOwnProfile,
}) => {
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchFollowers();
        }
    }, [isOpen, userId]);

    const fetchFollowers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${userId}/followers`);
            if (!response.ok) {
                throw new Error("Failed to fetch followers");
            }
            const data = await response.json();
            setFollowers(data);
        } catch (error) {
            console.error("Error fetching followers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFollower = async (followerId: string) => {
        setRemovingId(followerId);
        try {
            const response = await fetch(`/api/users/followers/${followerId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to remove follower");
            }

            // Update the followers list
            setFollowers(
                followers.filter((follower) => follower.id !== followerId)
            );
        } catch (error) {
            console.error("Error removing follower:", error);
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md bg-[#FFFBEb] border-[#5C5537]/20 [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="text-[#5C5537]">
                        Followers
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1 text-[#5C5537]/70 hover:text-[#5C5537] hover:bg-[#5C5537]/10">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#5C5537]" />
                        </div>
                    ) : followers.length === 0 ? (
                        <div className="text-center py-8 text-[#5C5537]/70">
                            No followers yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {followers.map((follower) => (
                                <div
                                    key={follower.id}
                                    className="flex items-center justify-between p-2 hover:bg-[#5C5537]/5 rounded-md">
                                    <Link
                                        href={`/profile/${follower.name}`}
                                        className="flex items-center gap-3 flex-1">
                                        <img
                                            src={
                                                follower.image_url ||
                                                "/default-avatar.jpg"
                                            }
                                            alt={follower.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <div className="font-medium text-[#5C5537]">
                                                {follower.name}
                                            </div>
                                        </div>
                                    </Link>

                                    {isOwnProfile && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-[#5C5537]/70 hover:text-red-500 hover:bg-red-50"
                                            onClick={() =>
                                                handleRemoveFollower(
                                                    follower.id
                                                )
                                            }
                                            disabled={
                                                removingId === follower.id
                                            }>
                                            {removingId === follower.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FollowersModal;
