// useFollow.ts
"use client";

import { useState, useCallback } from "react";

interface UseFollowProps {
  userId: string;
  initialFollowStatus: 'following' | 'requested' | 'not_following';
  initialFollowerCount: number;
}

interface UseFollowReturn {
  followStatus: 'following' | 'requested' | 'not_following';
  followerCount: number;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
}

export const useFollow = ({
  userId,
  initialFollowStatus,
  initialFollowerCount,
}: UseFollowProps): UseFollowReturn => {
  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'not_following'>(initialFollowStatus);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (followStatus === 'not_following') {
        // Following/requesting
        const response = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingId: userId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isRequest) {
            setFollowStatus('requested');
            // Don't increment follower count for requests
          } else {
            setFollowStatus('following');
            setFollowerCount(prev => prev + 1);
          }
        } else {
          const errorData = await response.json();
          console.error('Follow failed:', errorData.error);
        }
      } else {
        // Unfollowing or canceling request
        const response = await fetch('/api/follow', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingId: userId,
          }),
        });

        if (response.ok) {
          const wasFollowing = followStatus === 'following';
          setFollowStatus('not_following');
          if (wasFollowing) {
            setFollowerCount(prev => prev - 1);
          }
        } else {
          const errorData = await response.json();
          console.error('Unfollow failed:', errorData.error);
        }
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, followStatus, isLoading]);

  return {
    followStatus,
    followerCount,
    isLoading,
    toggleFollow,
  };
};

