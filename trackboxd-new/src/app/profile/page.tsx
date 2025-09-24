"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  Star,
  MessageCircle,
  Bookmark,
  Plus,
  MoreHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverArt: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  profilePic: string;
  spotifyFollowers: number;
  spotifyFollowing: number;
  trackboxdFollowers: number;
  trackboxdFollowing: number;
  reviewsCount: number;
  annotationsCount: number;
  likesCount: number;
  favoriteSongs: Track[];
}

interface ActivityItem {
  id: string;
  type: "like" | "review" | "annotation";
  track: Track;
  timestamp: string;
}

const Profile = () => {
  // const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate fetching user data
    setUser({
      id: "user-1",
      name:  "Iznah Waqar",
      username: "iznauurr",
      profilePic: "https://a.ltrbxd.com/resized/avatar/upload/2/1/8/7/3/2/2/1/shard/avtr-0-1000-0-1000-crop.jpg?v=8adb21e83a",
      spotifyFollowers: 50,
      spotifyFollowing: 30,
      trackboxdFollowers: 1,
      trackboxdFollowing: 1,
      reviewsCount: 47,
      annotationsCount: 28,
      likesCount: 156,
      favoriteSongs: [
        {
          id: "1",
          title: "Stop Breathing",
          artist: "Playboi Carti",
          coverArt: "https://i.scdn.co/image/ab67616d0000b27398ea0e689c91f8fea726d9bb",
        },
        {
          id: "2",
          title: "Bags",
          artist: "Clairo",
          coverArt: "https://upload.wikimedia.org/wikipedia/en/d/dc/Clairo_-_Charm.png",
        },
        {
          id: "3",
          title: "FOMDJ",
          artist: "Playboi Carti",
          coverArt: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Playboi_Carti_-_Music.png/960px-Playboi_Carti_-_Music.png",
        },
        {
          id: "4",
          title: "Good 4 U",
          artist: "Olivia Rodrigo",
          coverArt: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Olivia_Rodrigo_-_SOUR.png/250px-Olivia_Rodrigo_-_SOUR.png",
        },
      ]
    });

    // Simulate recent activity
    setRecentActivity([
      {
        id: "a1",
        type: "review",
        track: {
          id: "5",
          title: "Levitating",
          artist: "Dua Lipa",
          coverArt: "https://upload.wikimedia.org/wikipedia/en/c/c3/Tyler%2C_the_Creator_-_Flower_Boy.png",
        },
        timestamp: "2 hours ago"
      },
      {
        id: "a2",
        type: "like",
        track: {
          id: "6",
          title: "Stay",
          artist: "The Kid LAROI & Justin Bieber",
          coverArt: "https://upload.wikimedia.org/wikipedia/en/5/51/Igor_-_Tyler%2C_the_Creator.jpg",
        },
        timestamp: "5 hours ago"
      },
      {
        id: "a3",
        type: "annotation",
        track: {
          id: "7",
          title: "Blinding Lights",
          artist: "The Weeknd",
          coverArt: "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png",
        },
        timestamp: "1 day ago"
      },
      {
        id: "a4",
        type: "review",
        track: {
          id: "8",
          title: "Save Your Tears",
          artist: "The Weeknd",
          coverArt: "https://upload.wikimedia.org/wikipedia/en/8/8b/The_Weeknd_-_Save_Your_Tears.png",
        },
        timestamp: "2 days ago"
      }
    ]);

  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFFF0]">

        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <div className="animate-pulse">
            <div className="rounded-full bg-gray-200 h-32 w-32 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg aspect-square"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  // Stats card component
  const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
    <div className="p-4 text-center">
      <div className="flex justify-center mb-2 text-[#6D9773]">
        {icon}
      </div>
      <div className="text-2xl font-bold text-[#0C3B2E]">{value}</div>
      <div className="text-sm text-[#A0A0A0]">{label}</div>
    </div>
  );

  // Activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5" />;
      case "review":
        return <Star className="w-5 h-5" />;
      case "annotation":
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <Bookmark className="w-5 h-5" />;
    }
  };

  // Activity card
  const ActivityCard = ({ activity }: { activity: ActivityItem }) => (
    <div className="flex items-center gap-4 bg-[#FFFFF5] border border-[#D9D9D9] rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="text-[#6D9773]">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[#0C3B2E] capitalize">{activity.type}</div>
        <div className="text-[#1F2C24] truncate">{activity.track.title}</div>
        <div className="text-sm text-[#A0A0A0] truncate">{activity.track.artist}</div>
      </div>
      <div className="text-xs text-[#A0A0A0] whitespace-nowrap">
        {activity.timestamp}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFFF0]">


      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header - Improved responsiveness */}
        <div className="flex flex-col items-center md:flex-row gap-8 mb-8">
          {/* Profile Image - Centered on mobile */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative">
              <img 
                src={user.profilePic} 
                alt={user.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#FFFFF5] shadow-lg"
              />
            </div>
          </div>

          {/* Profile Info - Full width on mobile */}
          <div className="flex-1 w-full">
            <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4 mb-6">
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-[#0C3B2E]">{user.username}</h1>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex items-center gap-2 ${isFollowing ? "bg-[#6D9773] hover:bg-[#5C8769]" : "bg-[#0C3B2E] hover:bg-[#1F2C24]"}`}
                >
                  {isFollowing ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                
                <Button variant="outline" className="border-[#D9D9D9] bg-[#FFFFF5] text-[#0C3B2E] hover:bg-[#F2F3EF]">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats Grid - Responsive columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard 
                icon={<Users className="w-6 h-6 mx-auto" />} 
                value={user.trackboxdFollowers} 
                label="Followers" 
              />
              <StatCard 
                icon={<Users className="w-6 h-6 mx-auto" />} 
                value={user.trackboxdFollowing} 
                label="Following" 
              />
              <StatCard 
                icon={<Star className="w-6 h-6 mx-auto" />} 
                value={user.reviewsCount} 
                label="Reviews" 
              />
              <StatCard 
                icon={<MessageCircle className="w-6 h-6 mx-auto" />} 
                value={user.annotationsCount} 
                label="Annotations" 
              />
            </div>
          </div>
        </div>

        {/* Favorite Songs - Show info without hover */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#0C3B2E]">Favorite Songs</h2>
            <Button variant="outline" className="border-[#D9D9D9] bg-[#FFFFF5] text-[#0C3B2E] hover:bg-[#F2F3EF]">
              <Plus className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {user.favoriteSongs.map((song, index) => (
              <div key={song.id} className="bg-[#FFFFF5] border border-[#D9D9D9] rounded-lg overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={song.coverArt}
                    alt={`${song.title} cover`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {/* Song info always visible */}
                <div className="p-2 bg-[#FFFFF5]">
                  <div className="font-bold text-[#0C3B2E] truncate text-sm">{song.title}</div>
                  <div className="text-xs text-[#A0A0A0] truncate">{song.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#0C3B2E] mb-6">Recent Activity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recently Liked */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-[#6D9773] w-5 h-5" />
                <h3 className="font-bold text-[#0C3B2E]">Recently Liked</h3>
              </div>
              <div className="space-y-3">
                {recentActivity
                  .filter(a => a.type === "like")
                  .slice(0, 4)
                  .map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
              </div>
            </div>
            
            {/* Recently Reviewed */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="text-[#6D9773] w-5 h-5" />
                <h3 className="font-bold text-[#0C3B2E]">Recently Reviewed</h3>
              </div>
              <div className="space-y-3">
                {recentActivity
                  .filter(a => a.type === "review")
                  .slice(0, 4)
                  .map(activity => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="text-[#6D9773] w-5 h-5" />
              <h3 className="font-bold text-[#0C3B2E]">Recently Annotated</h3>
            </div>
            <div className="space-y-3">
              {recentActivity
                .filter(a => a.type === "annotation")
                .slice(0, 4)
                .map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
            </div>
          </div>
        </div>

        {/* Following Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#0C3B2E]">Following</h2>
            <Button variant="link" className="text-[#6D9773] hover:text-[#5C8769] p-0">
              View All
            </Button>
          </div>
          
          <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="flex-shrink-0 flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-[#FFFFF5]"></div>

                </div>
                <div className="mt-2 text-sm font-medium text-[#0C3B2E] truncate max-w-[80px]">
                  UmerNoor{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Footer variant="light" />
    </div>
  );
};

export default Profile;