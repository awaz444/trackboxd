"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import { Bell, Heart, UserPlus, Check } from "lucide-react";

interface Notification {
  id: string;
  type: "like" | "follow" | "comment" | "new_content";
  source_id: string;
  target_id?: string;
  is_read: boolean;
  created_at: string;
  source_user?: {
    id: string;
    name: string;
    image_url?: string;
  };
  details?: {
    type: 'review' | 'annotation';
    text: string;
    itemName?: string;
  };
}

const NotificationsPage = () => {
  const { user, loading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user && !userLoading) {
      fetchNotifications();
    }
  }, [user, userLoading]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      
      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }
      
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        });
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate based on type
    if (notification.type === "follow" && notification.source_user) {
      router.push(`/profile/${encodeURIComponent(notification.source_user.name)}`);
    } else if (notification.type === "like") {
      router.push(`/profile/${encodeURIComponent(user!.name)}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return "Just now";
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo}d ago`;
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">
        <div className="max-w-5xl mx-auto px-4 py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-lg mb-4 text-[#5C5537]">Please log in to view notifications</p>
          <Link 
            href="/login" 
            className="bg-[#5C5537] text-white px-4 py-2 rounded-full hover:bg-[#3E3725]"
          >
            Log in
          </Link>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#5C5537]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#5C5537] text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-sm text-[#5C5537]/70 hover:text-[#5C5537] flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="mt-2 text-[#5C5537] hover:text-[#3E3725]"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-[#5C5537]/5 rounded-lg border border-[#5C5537]/10">
            <Bell className="w-12 h-12 text-[#5C5537]/30 mx-auto mb-3" />
            <p className="text-[#5C5537]/70">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  relative p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-4
                  ${notification.is_read 
                    ? "bg-[#FFFBEb] border-[#5C5537]/10 hover:border-[#5C5537]/30" 
                    : "bg-[#5C5537] border-[#5C5537] shadow-md"
                  }
                `}
              >
                {!notification.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#FFFBEb]" />
                )}

                {/* Icon based on type */}
                <div className={`
                  p-2 rounded-full flex-shrink-0
                  ${notification.is_read 
                    ? (notification.type === 'like' ? 'bg-red-100 text-red-500' : 
                       notification.type === 'follow' ? 'bg-blue-100 text-blue-500' : 
                       'bg-[#5C5537]/10 text-[#5C5537]')
                    : 'bg-[#FFFBEb]/20 text-[#FFFBEb]'
                  }
                `}>
                  {notification.type === 'like' ? <Heart className="w-5 h-5 fill-current" /> :
                   notification.type === 'follow' ? <UserPlus className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <img 
                      src={notification.source_user?.image_url || "/default-avatar.jpg"} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover border border-white/20"
                    />
                    <span className={`font-semibold ${notification.is_read ? "text-[#5C5537]" : "text-[#FFFBEb]"}`}>
                      {notification.source_user?.name || "Someone"}
                    </span>
                    <span className={`text-sm ${notification.is_read ? "text-[#5C5537]/70" : "text-[#FFFBEb]/70"}`}>
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${notification.is_read ? "text-[#5C5537]" : "text-[#FFFBEb]"}`}>
                    {notification.type === 'like' && notification.details ? (
                      <>
                        liked your {notification.details.type}, "{notification.details.text.substring(0, 30)}{notification.details.text.length > 30 ? '...' : ''}" of {notification.details.itemName}
                      </>
                    ) : notification.type === 'like' ? (
                      "liked your content"
                    ) : notification.type === 'follow' ? (
                      "started following you"
                    ) : (
                      "commented on your post"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer variant="light" />
    </div>
  );
};

export default NotificationsPage;
