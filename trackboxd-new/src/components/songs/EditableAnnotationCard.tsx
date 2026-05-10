// EditableAnnotationCard.tsx
import React, { useState } from "react";
import { Edit, Trash, Clock, Heart, MessageCircle } from "lucide-react";
import { Annotation } from "@/app/tracks/types";
import AnnotationForm from "@/components/log/forms/AnnotationForm";

interface EditableAnnotationCardProps {
  annotation: Annotation;
  onEdit: (annotation: Annotation) => void;
  onDelete: (annotationId: string) => void;
}

const EditableAnnotationCard: React.FC<EditableAnnotationCardProps> = ({ 
  annotation, 
  onEdit, 
  onDelete 
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSave = (updatedAnnotation: any) => {
    onEdit({
      ...annotation,
      ...updatedAnnotation
    });
    setIsEditMode(false);
  };

  if (isEditMode) {
    return (
      <div className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4 mb-4">
        <AnnotationForm 
          onClose={() => setIsEditMode(false)}
          onSave={handleSave}
          initialAnnotation={{
            id: annotation.id,
            text: annotation.text,
            timestamp: annotation.timestamp,
            isPublic: annotation.is_public,
            track: {
              id: annotation.item.id,
              name: annotation.item.name,
              artist: annotation.item.artist,
              album: annotation.item.album,
              coverArt: annotation.item.cover_url
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
            src={annotation.item.cover_url || "/default-album.png"}
            alt={`${annotation.item.name} cover`}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-[#5C5537]">
                {annotation.item.name}
              </h3>
              <p className="text-[#5C5537]/70 text-sm truncate">
                {annotation.item.artist}
              </p>
              <p className="text-[#5C5537]/70 text-xs truncate">
                {annotation.item.album}
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
                onClick={() => onDelete(annotation.id)}
                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-1 text-[#5C5537]/70 text-sm">
            <Clock size={14} />
            <span>{formatDuration(annotation.timestamp)}</span>
          </div>
          
          {annotation.text && (
            <p className="text-[#5C5537] text-sm mb-3 bg-[#FFFBEb] rounded-md p-3 border border-[#5C5537]/10">
              {annotation.text}
            </p>
          )}
          
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-[#5C5537]/70">
              <span>{new Date(annotation.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-[#5C5537]/70">
                <Heart className="w-3 h-3" />
                <span className="text-xs">{annotation.like_count || 0}</span>
              </div>
              {/* <div className="flex items-center space-x-1 text-[#5C5537]/70">
                <MessageCircle className="w-3 h-3" />
                <span className="text-xs">{annotation.comment_count || 0}</span>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableAnnotationCard;