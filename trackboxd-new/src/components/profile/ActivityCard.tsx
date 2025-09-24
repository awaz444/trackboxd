// ActivityCard.tsx
import React from "react";
import { Heart, Star, MessageCircle, Bookmark } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "like" | "review" | "annotation";
  track: {
    id: string;
    title: string;
    artist: string;
    cover_url?: string;
  };
  timestamp: string;
}

interface ActivityCardProps {
  activity: ActivityItem;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
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

  return (
    <div className="flex items-center gap-4 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="text-[#5C5537]">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[#5C5537] capitalize">{activity.type}</div>
        <div className="text-[#5C5537] truncate">{activity.track.title}</div>
        <div className="text-sm text-[#5C5537]/70 truncate">{activity.track.artist}</div>
      </div>
      <div className="text-xs text-[#5C5537]/70 whitespace-nowrap">
        {activity.timestamp}
      </div>
    </div>
  );
};

export default ActivityCard;
