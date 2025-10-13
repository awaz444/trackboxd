"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProfilePromptsEditor from "./ProfilePromptsEditor";

interface PromptDef {
  id: string;
  key: string;
  question: string;
  type: 'text'|'track'|'album'|'playlist';
}

interface PromptResponseItem {
  id: string;
  prompt_id?: string | null;
  promptKey: string;
  type: 'text' | 'track' | 'album' | 'playlist';
  item?: { id: string; type: string; name: string; artist?: string; cover_url?: string; spotify_url?: string } | null;
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
  const [prompts, setPrompts] = useState<PromptDef[]>([]);
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

  useEffect(() => {
    // Fetch prompts to display headings; keys are used only for matching
    fetch('/api/profile/prompts')
      .then(r => r.json())
      .then((list) => setPrompts(list))
      .catch(() => setPrompts([]));
  }, []);

  return (
    <div className="mb-10">
      {isOwnProfile && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#5C5537]">Profile Prompts</h2>
          <Button 
            variant="outline"
            className="border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] hover:bg-[#5C5537]/10"
            onClick={() => setIsEditing(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      )}

      {/* Only show prompts that have been answered; make items clickable */}
      <div className="space-y-6">
        {prompts
          .map((p) => {
            const r = responses.find((x) => x.prompt_id === p.id || x.promptKey === p.key) || null;
            const hasAnswer = r ? (r.type === 'text' ? !!(r.text && r.text.trim()) : !!r.item) : false;
            return hasAnswer && r ? { prompt: p, response: r } : null;
          })
          .filter((x): x is { prompt: PromptDef; response: PromptResponseItem } => !!x)
          .map(({ prompt: p, response: r }) => {
            const internalHref = r.item
              ? r.item.type === 'track'
                ? `/songs/${r.item.id}`
                : r.item.type === 'album'
                  ? `/albums/${r.item.id}`
                  : r.item.type === 'playlist'
                    ? `/playlists/${r.item.id}`
                    : undefined
              : undefined;
            const href = internalHref || r.item?.spotify_url;
            return (
              <div key={p.id}>
                <h2 className="text-2xl font-bold text-[#5C5537]">{p.question}...</h2>
                <div className="mt-3 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg">
                  {r.type === 'text' ? (
                    <div className="text-[#5C5537]">{r.text}</div>
                  ) : r.item ? (
                    href ? (
                      <a href={href} className="flex items-center gap-3 p-4 rounded">
                        <div className="w-16 h-16 rounded bg-[#5C5537]/10 overflow-hidden">
                          <img src={r.item.cover_url || '/default-avatar.jpg'} alt={r.item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#5C5537] truncate">{r.item.name}</div>
                          {r.item.artist && (
                            <div className="text-sm text-[#5C5537]/70 truncate">{r.item.artist}</div>
                          )}
                        </div>
                      </a>
                    ) : (
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
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        {prompts.length === 0 && (
          <div className="text-[#5C5537]/50">No prompts available.</div>
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