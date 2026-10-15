import React from "react";
import GlobalActivityGrid from "@/components/activity/GlobalActivityGrid";
import { getGlobalActivity } from "@/lib/global-activity";

const MIN_ITEMS = 4;

// Live feed of real public activity for the logged-out landing page. Renders
// nothing when there isn't enough recent activity to look honest.
export default async function GlobalActivity() {
  const { items, countries } = await getGlobalActivity();
  if (items.length < MIN_ITEMS) return null;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 pb-10" aria-labelledby="live-activity">
      <h2 id="live-activity" className="text-center text-sm font-bold text-[#5C5537] uppercase tracking-wide mb-2">
        Happening on Trackboxd
      </h2>
      <GlobalActivityGrid items={items} countries={countries} />
    </section>
  );
}
