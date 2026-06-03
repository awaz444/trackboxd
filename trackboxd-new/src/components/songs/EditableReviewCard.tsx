"use client";
import React, { useState } from "react";
import { Edit, Trash, Star, Heart } from "lucide-react";
import { Review } from "@/app/tracks/types";
import ReviewForm from "@/components/log/forms/ReviewForm";

interface EditableReviewCardProps {
  review: Review;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
}

const EditableReviewCard: React.FC<EditableReviewCardProps> = ({ 
  review, 
  onEdit, 
  onDelete 
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return (
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-[#5C5537]/20" />
            {fill > 0 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="w-4 h-4 text-[#FFBA00] fill-[#FFBA00]" />
              </div>
            )}
          </div>
        )
      })}
      <span className="text-sm text-[#5C5537]/70 ml-1.5">{rating}</span>
    </div>
  );

  const handleSave = (updatedReview: any) => {
    onEdit({
      ...review,
      ...updatedReview
    });
    setIsEditMode(false);
  };

  if (isEditMode) {
    return (
      <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 mb-4">
        <ReviewForm 
          onClose={() => setIsEditMode(false)}
          onSave={handleSave}
          initialReview={{
            id: review.id,
            rating: review.rating,
            text: review.text,
            isPublic: review.is_public,
            track: {
              id: review.item.id,
              name: review.item.name,
              artist: review.item.artist,
              album: review.item.album,
              coverArt: review.item.cover_url
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg overflow-hidden transition-shadow duration-200 mb-4">
      <div className="p-4 flex items-start gap-4">
        <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
          <img
            src={review.item.cover_url || "/default-album.png"}
            alt={`${review.item.name} cover`}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-[#5C5537]">
                {review.item.name}
              </h3>
              <p className="text-[#5C5537]/70 text-sm truncate">
                {review.item.artist}
              </p>
              <p className="text-[#5C5537]/70 text-xs truncate">
                {review.item.album}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditMode(true)}
                className="p-2 text-[#5C5537] hover:bg-[#5C5537]/10 rounded-full transition-colors"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(review.id)}
                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            {renderStars(review.rating)}
          </div>
          
          {review.text && (
            <p className="text-[#5C5537] text-sm mb-3">
              {review.text}
            </p>
          )}
          
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-[#5C5537]/70">
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-[#5C5537]/70">
                <Heart className="w-3 h-3" />
                <span className="text-xs">{review.like_count || 0}</span>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableReviewCard;