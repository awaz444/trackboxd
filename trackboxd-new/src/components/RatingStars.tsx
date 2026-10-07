import React from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  size?: "xs" | "sm" | "md";
  showNumber?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = "sm",
  showNumber = true,
}) => {
  const starClass =
    size === "md" ? "w-5 h-5" : size === "xs" ? "w-3.5 h-3.5" : "w-4 h-4";
  const textClass =
    size === "md" ? "text-base ml-1.5" : size === "xs" ? "text-xs ml-1" : "text-sm ml-1.5";
  const display = Number.isInteger(rating) ? rating.toString() : rating.toFixed(1);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <div key={i} className={`relative ${starClass}`}>
            <Star className={`${starClass} text-[#5C5537]/20`} />
            {fill > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={`${starClass} text-[#FFBA00] fill-[#FFBA00]`} />
              </div>
            )}
          </div>
        );
      })}
      {showNumber && (
        <span className={`text-[#5C5537] ${textClass}`}>{display}</span>
      )}
    </div>
  );
};

export default RatingStars;
