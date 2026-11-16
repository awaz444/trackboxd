"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Nudge for people who have not rated anything yet. Most new accounts never
 * write a first review, and their feed is empty, so point them at a song.
 * Renders nothing until we know the count is zero (and on any error).
 */
export default function FirstReviewPrompt({ userId }: { userId?: string | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count, error }) => {
        if (!cancelled && !error && count === 0) setShow(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!show) return null;

  return (
    <section className="mb-10 rounded-xl bg-[#5C5537]/5 px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-[#5C5537] flex items-center gap-2">
          <Star className="w-5 h-5 text-[#FFBA00] fill-[#FFBA00]" aria-hidden="true" />
          Rate your first song
        </h2>
        <p className="text-sm text-[#6B6547] mt-1">
          Pick a track you have on repeat, give it stars and say why. It starts your diary and your profile.
        </p>
      </div>
      <Link
        href="/tracks"
        className="inline-block shrink-0 text-center bg-[#5C5537] hover:bg-[#3E3725] text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors"
      >
        Find a song to rate
      </Link>
    </section>
  );
}
