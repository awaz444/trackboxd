import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import { getGlobalActivity, type GlobalActivityItem } from "@/lib/global-activity";

const MIN_ITEMS = 4;

function flag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function mmss(sec: number) {
  const t = Math.floor(sec);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}

function ActivityCard({ item }: { item: GlobalActivityItem }) {
  return (
    <article className="bg-white/60 rounded-xl p-4 text-left flex gap-3 hover:bg-white transition-colors">
      <Link href={item.href} className="flex-shrink-0">
        {item.track.cover_url ? (
          <img
            src={item.track.cover_url}
            alt={`${item.track.name} by ${item.track.artist}`}
            loading="lazy"
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-[#5C5537]/10" aria-hidden />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={item.href} className="block font-semibold text-sm text-[#5C5537] truncate hover:underline">
          {item.track.name}
        </Link>
        <p className="text-xs text-[#5C5537]/60 truncate">{item.track.artist}</p>

        <div className="mt-1 flex items-center gap-2 text-xs text-[#5C5537]/70">
          {item.kind === "review" && item.rating !== null ? (
            <RatingStars rating={item.rating} size="xs" showNumber={false} />
          ) : item.timestamp !== null ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {mmss(item.timestamp)}
            </span>
          ) : null}
        </div>

        {item.text && (
          <p className="mt-1 text-sm text-[#5C5537] line-clamp-2">&ldquo;{item.text}&rdquo;</p>
        )}

        <p className="mt-2 text-xs text-[#5C5537]/60 truncate">
          <Link href={`/profile/${item.user.name}`} className="font-medium hover:underline">
            {item.user.name}
          </Link>
          {item.country && (
            <span title={item.country.name}>
              {" "}
              · {flag(item.country.code)} {item.country.name}
            </span>
          )}{" "}
          · {timeAgo(item.created_at)}
        </p>
      </div>
    </article>
  );
}

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
      {countries.length >= 2 && (
        <p className="text-center text-xl mb-5" aria-label="Listening from around the world">
          {countries.map((c) => (
            <span key={c.code} title={c.name} className="mx-0.5">
              {flag(c.code)}
            </span>
          ))}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={`${item.kind}-${item.id}`} className={i >= 6 ? "hidden sm:block" : undefined}>
            <ActivityCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
