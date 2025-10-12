"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FollowRequest {
  follower_id: string;
  created_at: string;
  follower: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface FollowRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FollowRequestsModal: React.FC<FollowRequestsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState<{[key: string]: 'accept' | 'reject' | null}>({});

  useEffect(() => {
    if (isOpen) {
      fetchFollowRequests();
    }
  }, [isOpen]);

  const fetchFollowRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/follow-requests');
      if (!response.ok) {
        throw new Error("Failed to fetch follow requests");
      }
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (followerId: string) => {
    setLoadingActions(prev => ({ ...prev, [followerId]: 'accept' }));
    try {
      const response = await fetch(`/api/follow-requests/${followerId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to accept request');
      }

      // Remove the accepted request from the list
      setRequests(prev => prev.filter(req => req.follower_id !== followerId));
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [followerId]: null }));
    }
  };

  const handleReject = async (followerId: string) => {
    setLoadingActions(prev => ({ ...prev, [followerId]: 'reject' }));
    try {
      const response = await fetch(`/api/follow-requests/${followerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      // Remove the rejected request from the list
      setRequests(prev => prev.filter(req => req.follower_id !== followerId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [followerId]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#FFFBEb] rounded-lg w-full max-w-md mx-4 z-50 border border-[#5C5537]/20">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#5C5537]/10">
          <h2 className="text-lg font-semibold text-[#5C5537]">Follow Requests</h2>
          <button
            onClick={onClose}
            className="text-[#5C5537]/70 hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5C5537] border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-[#5C5537]/70">
              No pending follow requests
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.follower_id}
                  className="flex items-center justify-between p-3 hover:bg-[#5C5537]/5 rounded-md border border-[#5C5537]/10"
                >
                  <Link
                    href={`/profile/${request.follower.name}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <img
                      src={request.follower.image_url || "/default-avatar.jpg"}
                      alt={request.follower.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-[#5C5537]">
                        {request.follower.name}
                      </div>
                      <div className="text-sm text-[#5C5537]/70">
                        @{request.follower.name}
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[#5C5537]/90 hover:bg-[#5C5537] text-white"
                      onClick={() => handleAccept(request.follower_id)}
                      disabled={!!loadingActions[request.follower_id]}
                    >
                      {loadingActions[request.follower_id] === 'accept' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#5C5537]/70 border-[#5C5537]/30 hover:bg-red-50 hover:text-red-500 hover:border-red-300"
                      onClick={() => handleReject(request.follower_id)}
                      disabled={!!loadingActions[request.follower_id]}
                    >
                      {loadingActions[request.follower_id] === 'reject' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowRequestsModal;