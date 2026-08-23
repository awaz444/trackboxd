import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

// `page.tsx` is a client component and cannot export metadata itself, so the
// route's metadata lives here.
export const metadata: Metadata = {
  title: "Browse Tracks — Rated and Reviewed Songs",
  description:
    "Browse songs rated, reviewed and annotated on Trackboxd. Find what people are listening to, see rating distributions, and read reviews of individual tracks.",
  keywords: [
    "song reviews",
    "rate songs",
    "track ratings",
    "music reviews by song",
  ],
  alternates: { canonical: `${SITE_URL}/tracks` },
  openGraph: {
    title: "Browse Tracks on Trackboxd",
    description:
      "Songs rated, reviewed and annotated by listeners on Trackboxd.",
    url: `${SITE_URL}/tracks`,
  },
};

export default function TracksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
