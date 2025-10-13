"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProfilePromptsEditor from "./ProfilePromptsEditor";

interface PromptResponseItem {
  id: string;
  promptKey: string;
  type: 'text' | 'track' | 'album' | 'playlist';
  item?: { id: string; type: string; name: string; artist?: string; cover_url?: string } | null;
  text?: string | null;
  created_at: string;
}

interface ProfilePromptsProps {
  username: string;
  isOwnProfile?: boolean;
  initialResponses?: PromptResponseItem[];
}

const ProfilePrompts: React.FC<ProfilePromptsProps> = ({ username, isOwnProfile = false, initialResponses = [] }) => {
  const [responses, setResponses] = useState<PromptResponseItem[]>(initialResponses);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // If responses not provided, fetch via API
    if (!initialResponses || initialResponses.length === 0) {
      fetch(`/api/profile/prompt-responses?username=${encodeURIComponent(username)}`)
        .then(r => r.json())
        .then(setResponses)
        .catch(() => setResponses([]));
    }
  }, [username]);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#5C5537]">Profile Prompts</h2>
        {isOwnProfile && (
          <Button 
            variant="outline"
            className="border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] hover:bg-[#5C5537]/10"
            onClick={() => setIsEditing(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Responses grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {responses.map((r) => (
          <div key={r.id} className="bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg p-4">
            <div className="text-sm text-[#5C5537]/60 mb-1">{r.promptKey}</div>
            {r.type === 'text' ? (
              <div className="text-[#5C5537]">{r.text}</div>
            ) : r.item ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded bg-[#5C5537]/10 overflow-hidden">
                  <img src={r.item.cover_url || '/default-avatar.jpg'} alt={r.item.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[#5C5537] truncate">{r.item.name}</div>
                  {r.item.artist && (
                    <div className="text-sm text-[#5C5537]/70 truncate">{r.item.artist}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-[#5C5537]/50">No response</div>
            )}
          </div>
        ))}
        {responses.length === 0 && (
          <div className="text-[#5C5537]/50">No prompts answered yet.</div>
        )}
      </div>

      {isEditing && (
        <ProfilePromptsEditor
          username={username}
          responses={responses}
          onClose={() => setIsEditing(false)}
          onResponsesUpdate={(updated) => setResponses(updated)}
        />
      )}
    </div>
  );
};

export default ProfilePrompts;