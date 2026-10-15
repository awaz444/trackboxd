import React from "react";

interface ThreadReview {
  id: string;
  rating: number;
  created_at: string;
  users: { id: string };
}

export interface ThreadEntryContext {
  /** Position inside the person's thread, oldest = 0. */
  index: number;
  /** Number of reviews in the thread. */
  count: number;
  /** The person's one rating for this item, shared by every entry. */
  rating: number;
  /** True when the person has more than one review of the item. */
  isThread: boolean;
}

interface Thread<T> {
  userId: string;
  rating: number;
  entries: T[];
  lastActivity: number;
}

// One thread per person: their reviews oldest to newest, sharing one rating.
// Threads are ordered by their most recent review, newest first.
export function groupReviewsIntoThreads<T extends ThreadReview>(reviews: T[]): Thread<T>[] {
  const byUser = new Map<string, T[]>();
  reviews.forEach((r) => {
    const list = byUser.get(r.users.id) ?? [];
    list.push(r);
    byUser.set(r.users.id, list);
  });

  const time = (r: T) => new Date(r.created_at).getTime();
  const threads: Thread<T>[] = [];
  byUser.forEach((list, userId) => {
    const entries = [...list].sort((a, b) => time(a) - time(b));
    const latest = entries[entries.length - 1];
    threads.push({
      userId,
      // The latest review carries the current rating (the database keeps all equal).
      rating: latest.rating,
      entries,
      lastActivity: time(latest),
    });
  });
  return threads.sort((a, b) => b.lastActivity - a.lastActivity);
}

interface Props<T extends ThreadReview> {
  reviews: T[];
  renderEntry: (review: T, ctx: ThreadEntryContext) => React.ReactNode;
}

export default function ReviewThreads<T extends ThreadReview>({ reviews, renderEntry }: Props<T>) {
  const threads = groupReviewsIntoThreads(reviews);

  return (
    <>
      {threads.map((thread) => {
        const count = thread.entries.length;
        if (count === 1) {
          return (
            <React.Fragment key={thread.entries[0].id}>
              {renderEntry(thread.entries[0], { index: 0, count: 1, rating: thread.rating, isThread: false })}
            </React.Fragment>
          );
        }
        return (
          <section
            key={thread.userId}
            aria-label={`${count} reviews over time`}
            className="relative pl-5 border-l-2 border-[#5C5537]/25 space-y-2"
          >
            {thread.entries.map((review, index) => (
              <div key={review.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.6rem] top-5 w-2.5 h-2.5 rounded-full bg-[#5C5537]/50 border-2 border-[#FFFBEb]"
                />
                {renderEntry(review, { index, count, rating: thread.rating, isThread: true })}
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
