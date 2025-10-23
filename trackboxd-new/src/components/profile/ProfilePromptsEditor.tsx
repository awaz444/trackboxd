"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Music, Album, ListMusic } from "lucide-react";

interface PromptDef {
  id: string;
  key: string;
  question: string;
  type: 'text'|'track'|'album'|'playlist';
}

interface PromptResponseItem {
  id: string;
  promptKey: string;
  type: 'text'|'track'|'album'|'playlist';
  item?: { id: string; type: string; name: string; artist?: string; cover_url?: string } | null;
  text?: string | null;
  created_at: string;
}

interface Props {
  username: string;
  responses: PromptResponseItem[];
  onResponsesUpdate: (items: PromptResponseItem[]) => void;
  onClose: () => void;
}

const ProfilePromptsEditor: React.FC<Props> = ({ username, responses, onResponsesUpdate, onClose }) => {
  const [prompts, setPrompts] = useState<PromptDef[]>([]);
  const [activePromptKey, setActivePromptKey] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile/prompts')
      .then(r => r.json())
      .then((list) => setPrompts(list))
      .catch(() => setPrompts([]));
  }, []);

  const activePrompt = useMemo(() => prompts.find(p => p.key === activePromptKey) || null, [prompts, activePromptKey]);

  const existingForActive = useMemo(() => responses.find(r => r.promptKey === activePromptKey) || null, [responses, activePromptKey]);

  useEffect(() => {
    if (activePrompt?.type === 'text') {
      setTextValue(existingForActive?.text || "");
    }
  }, [activePromptKey]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim() || !activePrompt) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      let url = '';
      if (activePrompt.type === 'track') url = `/api/songs/search?q=${encodeURIComponent(q)}`;
      if (activePrompt.type === 'album') url = `/api/albums/search?q=${encodeURIComponent(q)}`;
      if (activePrompt.type === 'playlist') url = `/api/playlists/search?q=${encodeURIComponent(q)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      let items: any[] = [];
      if (activePrompt.type === 'track') {
        items = (Array.isArray(data) ? data : data?.tracks?.items || []).map((t: any) => ({ id: t.id, name: t.name, artist: t.artists?.map((a: any) => a.name).join(', '), cover: t.album?.images?.[0]?.url }));
      } else if (activePrompt.type === 'album') {
        items = (Array.isArray(data) ? data : data || []).map((a: any) => ({ id: a.id, name: a.name, artist: a.artists?.map((x: any) => x.name).join(', '), cover: a.images?.[0]?.url }));
      } else if (activePrompt.type === 'playlist') {
        const itemsRaw = Array.isArray(data)
          ? data
          : (data?.playlists?.items || data?.items || []);
        items = (itemsRaw as any[]).filter(Boolean).map((p: any) => ({ id: p.id, name: p.name, artist: p.owner?.display_name ?? '', cover: p.images?.[0]?.url }));
      }
      setSearchResults(items);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const saveResponse = async () => {
    if (!activePrompt) return;
    setSaving(true);
    try {
      const payload: any = { promptKey: activePrompt.key, type: activePrompt.type };
      if (activePrompt.type === 'text') payload.value = textValue;
      else if (searchResults[0]) payload.value = searchResults[0].id;

      const res = await fetch('/api/profile/prompt-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');

      const updatedList = await fetch(`/api/profile/prompt-responses?username=${encodeURIComponent(username)}`)
        .then(r => r.json());
      onResponsesUpdate(updatedList);
      setActivePromptKey(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const deleteResponse = async (key: string) => {
    setDeletingKey(key);
    try {
      const res = await fetch('/api/profile/prompt-responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptKey: key }),
      });
      if (!res.ok) throw new Error('Failed to delete');

      const updatedList = await fetch(`/api/profile/prompt-responses?username=${encodeURIComponent(username)}`)
        .then(r => r.json());
      onResponsesUpdate(updatedList);
    } catch (e) {
      // no-op
    } finally {
      setDeletingKey(null);
    }
  };

  // Check if user has reached the 5-prompt limit
  const hasReachedLimit = responses.length >= 5;
  const availablePrompts = prompts.filter(p => 
    responses.some(r => r.promptKey === p.key) || !hasReachedLimit
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FFFBEb] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#5C5537]">Edit Profile Prompts</h2>
              {hasReachedLimit && (
                <p className="text-sm text-[#5C5537]/60 mt-1">
                  You've reached the maximum of 5 prompts. Delete one to add another.
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              aria-label="Close editor"
              className="text-[#5C5537] hover:bg-[#5C5537]/10 h-8 w-8 md:h-10 md:w-10 p-0"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>

          {/* Prompts list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            {availablePrompts.map((p) => {
              const existing = responses.find(r => r.promptKey === p.key);
              return (
                <div key={p.id} className="border border-[#5C5537]/20 rounded-lg p-3 md:p-4 flex flex-col justify-between">
                  <div className="text-sm md:text-base text-[#5C5537] mb-2 md:mb-3">{p.question}</div>
                  {existing ? (
                    <div className="flex items-center justify-between mt-auto pt-3 md:pt-4">
                      <div className="text-xs md:text-sm text-[#5C5537]/80 truncate flex-1 mr-2">
                        {existing.type === 'text' ? existing.text : existing.item?.name}
                      </div>
                      <div className="flex gap-1 md:gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/10 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-auto"
                          onClick={() => setActivePromptKey(p.key)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/10 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 h-auto"
                          disabled={deletingKey === p.key}
                          onClick={() => deleteResponse(p.key)}
                        >
                          {deletingKey === p.key ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : 'Delete'}
                        </Button>
                      </div>
                  </div>
                ) : (
                    <Button 
                      className="bg-[#5C5537] hover:bg-[#3E3725] text-white mt-auto text-xs md:text-sm px-3 md:px-4 py-2 md:py-2 h-auto" 
                      onClick={() => setActivePromptKey(p.key)}
                      disabled={hasReachedLimit}
                    >
                      {hasReachedLimit ? 'Limit Reached' : 'Answer'}
                    </Button>
                )}
              </div>
            );
          })}
            {availablePrompts.length === 0 && (
              <div className="text-[#5C5537]/50 text-sm md:text-base">No prompts available.</div>
            )}
          </div>

          {/* Editor for active prompt */}
          {activePrompt && (
            <div className="p-3 md:p-4 border border-[#5C5537]/20 rounded-lg">
              <div className="text-sm md:text-base text-[#5C5537] mb-2 md:mb-3">{activePrompt.question}</div>

              {activePrompt.type === 'text' ? (
                <Input 
                  value={textValue} 
                  onChange={(e) => setTextValue(e.target.value)} 
                  placeholder="Write your answer"
                  className="text-sm md:text-base"
                />
              ) : (
                <div>
                  <div className="relative mb-3 md:mb-4">
                    <Input
                      type="search"
                      placeholder={`Search ${activePrompt.type}s...`}
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-3 pr-10 text-sm md:text-base"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-[#5C5537] animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3 max-h-60 md:max-h-80 overflow-y-auto">
                    {searchResults.length === 0 && !isSearching && (
                      <div className="text-center py-6 md:py-8 text-[#5C5537]/50">
                        {activePrompt.type === 'track' && <Music className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2" />}
                        {activePrompt.type === 'album' && <Album className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2" />}
                        {activePrompt.type === 'playlist' && <ListMusic className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2" />}
                        <p className="text-sm md:text-base">{searchQuery ? `No results for "${searchQuery}"` : `Search for ${activePrompt.type}s`}</p>
                      </div>
                    )}
                    {searchResults.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 hover:bg-[#5C5537]/5 rounded-lg cursor-pointer" onClick={() => setSearchResults([t])}>
                        <div className="w-12 h-12 md:w-16 md:h-16 relative overflow-hidden rounded-lg bg-[#5C5537]/10 flex-shrink-0">
                          <img src={t.cover || '/default-avatar.jpg'} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-[#5C5537] truncate text-sm md:text-base">{t.name}</h4>
                          {t.artist && <p className="text-xs md:text-sm text-[#5C5537]/70 truncate">{t.artist}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 md:mt-4 flex gap-2">
                <Button 
                  className="bg-[#5C5537] hover:bg-[#3E3725] text-white text-xs md:text-sm px-3 md:px-4 py-2 h-auto" 
                  onClick={saveResponse} 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : 'Save'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#5C5537]/20 text-[#5C5537] hover:bg-[#5C5537]/10 text-xs md:text-sm px-3 md:px-4 py-2 h-auto" 
                  onClick={() => setActivePromptKey(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePromptsEditor;