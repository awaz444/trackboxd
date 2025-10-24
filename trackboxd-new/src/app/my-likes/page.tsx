"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Music,
  Album,
  List,
  Clock,
  Star
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Mock data for liked items
const likedItems = [
  {
    id: 1,
    type: "track",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    coverArt: "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png",
    timestamp: "2 hours ago",
    likedAt: "2023-05-15T14:30:00Z"
  },
  {
    id: 2,
    type: "album",
    title: "folklore",
    artist: "Taylor Swift",
    coverArt: "https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Folklore.png",
    timestamp: "1 day ago",
    likedAt: "2023-05-14T10:15:00Z"
  },
  {
    id: 3,
    type: "review",
    user: {
      name: "Sarah Johnson",
      avatar: "/api/placeholder/40/40",
      username: "sarahj",
    },
    title: "folklore review",
    content: "Every song tells a story. Pure poetry in musical form.",
    rating: 5.0,
    timestamp: "3 days ago",
    likedAt: "2023-05-12T16:45:00Z"
  },
  {
    id: 4,
    type: "annotation",
    user: {
      name: "Jordan Kim",
      avatar: "/api/placeholder/40/40",
      username: "jordank",
    },
    track: "Watermelon Sugar",
    artist: "Harry Styles",
    content: "This bridge section at 2:14 gives me chills every time 🎵",
    timestamp: "1 week ago",
    likedAt: "2023-05-08T09:20:00Z"
  },
  {
    id: 5,
    type: "playlist",
    title: "Midnight Vibes",
    creator: "Sarah Johnson",
    tracks: 24,
    coverArt: "https://misc.scdn.co/liked-songs/liked-songs-640.png",
    timestamp: "2 weeks ago",
    likedAt: "2023-05-01T18:30:00Z"
  }
].sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());

const LikeCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 ${className}`}>{children}</div>;

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <div key={star} className="relative mb-1">
        <div className="w-4 h-4 text-[#D9D9D9]">★</div>
        <div
          className="absolute top-0 left-0 w-5 h-5 text-[#FFBA00] overflow-hidden"
          style={{
            width: `${Math.max(0, Math.min(1, rating - star + 1)) * 100}%`,
          }}>
          ★
        </div>
      </div>
    ))}
    <span className="text-sm text-[#1F2C24] ml-1">{rating}</span>
  </div>
);

const UserAvatar = ({
  user,
  size = "w-10 h-10",
}: {
  user: any;
  size?: string;
}) => (
  <div
    className={`${size} rounded-full ring-2 ring-[#FFBA00] overflow-hidden flex-shrink-0`}>
    <Avatar className="w-full h-full">
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="bg-[#6D9773] text-[#F9F9F9]">
        {user.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
  </div>
);

const LikeItem = ({
  item,
  isLast = false,
}: {
  item: any;
  isLast?: boolean;
}) => {
  const renderContent = () => {
    switch (item.type) {
      case "track":
        return (
          <>
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-[#FFBA00]" />
              <h3 className="font-bold text-[#0C3B2E]">Liked Track</h3>
            </div>
            <div className="flex items-start gap-4 mt-3">
              <img
                src={item.coverArt}
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-medium text-[#1F2C24]">{item.title}</h4>
                <p className="text-sm text-[#A0A0A0]">
                  {item.artist} • {item.album}
                </p>
              </div>
            </div>
          </>
        );
      case "album":
        return (
          <>
            <div className="flex items-center gap-3">
              <Album className="w-6 h-6 text-[#FFBA00]" />
              <h3 className="font-bold text-[#0C3B2E]">Liked Album</h3>
            </div>
            <div className="flex items-start gap-4 mt-3">
              <img
                src={item.coverArt}
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-medium text-[#1F2C24]">{item.title}</h4>
                <p className="text-sm text-[#A0A0A0]">{item.artist}</p>
              </div>
            </div>
          </>
        );
      case "playlist":
        return (
          <>
            <div className="flex items-center gap-3">
              <List className="w-6 h-6 text-[#FFBA00]" />
              <h3 className="font-bold text-[#0C3B2E]">Liked Playlist</h3>
            </div>
            <div className="flex items-start gap-4 mt-3">
              <img
                src={item.coverArt}
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-medium text-[#1F2C24]">{item.title}</h4>
                <p className="text-sm text-[#A0A0A0]">
                  by {item.creator} • {item.tracks} tracks
                </p>
              </div>
            </div>
          </>
        );
      case "review":
        return (
          <>
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-[#FFBA00]" />
              <h3 className="font-bold text-[#0C3B2E]">Liked Review</h3>
            </div>
            <div className="flex items-start gap-4 mt-3">
              <UserAvatar user={item.user} size="w-12 h-12" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-[#1F2C24]">{item.user.name}</h4>
                  <RatingStars rating={item.rating} />
                </div>
                <p className="text-sm text-[#1F2C24] mt-1 line-clamp-2">
                  {item.content}
                </p>
              </div>
            </div>
          </>
        );
      case "annotation":
        return (
          <>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-[#FFBA00]" />
              <h3 className="font-bold text-[#0C3B2E]">Liked Annotation</h3>
            </div>
            <div className="flex items-start gap-4 mt-3">
              <UserAvatar user={item.user} size="w-12 h-12" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-[#1F2C24]">{item.user.name}</h4>
                  <Clock className="w-4 h-4 text-[#A0A0A0]" />
                  <span className="text-sm text-[#A0A0A0]">{item.timestamp}</span>
                </div>
                <p className="text-sm text-[#1F2C24] mt-1">
                  {item.track} by {item.artist}
                </p>
                <p className="text-sm text-[#1F2C24] mt-1 line-clamp-2">
                  {item.content}
                </p>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative pl-3">
      {/* Timeline line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#D9D9D9]"
        style={{ height: isLast ? "2.5rem" : "100%" }}
      />
      {/* Timeline dot */}
      <div className="absolute left-0 top-0 transform -translate-x-2/5 w-3 h-3 rounded-full bg-[#FFBA00] border-2 border-[#F9F9F6]" />

      <LikeCard className="space-y-1">
        {renderContent()}
        <div className="mt-3">
          <span className="text-xs text-[#A0A0A0]">
            Liked {item.timestamp}
          </span>
        </div>
      </LikeCard>
    </div>
  );
};

export default function LikesPage() {
  return (
    <div className="min-h-screen bg-[#FFFBEb]">

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-[#FFBA00]" />
            <h1 className="text-3xl font-bold text-[#0C3B2E]">
              Your Liked Items
            </h1>
          </div>
          <p className="text-[#0C3B2E]/70">
            All the songs, albums, playlists, reviews and annotations you've liked
          </p>
        </div>

        {/* Likes List */}
        <div>
          <h2 className="text-xl font-semibold text-[#0C3B2E] mb-4">
            {likedItems.length} Liked Items
          </h2>
          <div className="space-y-0">
            {likedItems.map((item, index) => (
              <LikeItem
                key={item.id}
                item={item}
                isLast={index === likedItems.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer variant="light" />
    </div>
  );
}