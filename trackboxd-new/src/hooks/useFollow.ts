// useFollow.ts
"use client";

import { useState, useCallback } from "react";

interface UseFollowProps {
  userId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
}

interface UseFollowReturn {
  isFollowing: boolean;
  followerCount: number;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
}

export const useFollow = ({
  userId,
  initialIsFollowing,
  initialFollowerCount,
}: UseFollowProps): UseFollowReturn => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Optimistic update - update UI immediately
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    setFollowerCount(prev => newFollowingState ? prev + 1 : prev - 1);
    
    try {
      const url = '/api/follow';
      const method = newFollowingState ? 'POST' : 'DELETE';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followingId: userId,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setIsFollowing(!newFollowingState);
        setFollowerCount(prev => newFollowingState ? prev - 1 : prev + 1);
        
        const errorData = await response.json();
        console.error('Follow/unfollow failed:', errorData.error);
        // You could show a toast notification here
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowing(!newFollowingState);
      setFollowerCount(prev => newFollowingState ? prev - 1 : prev + 1);
      console.error('Follow/unfollow error:', error);
      // You could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  }, [userId, isFollowing, isLoading]);

  return {
    isFollowing,
    followerCount,
    isLoading,
    toggleFollow,
  };
};
