import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Browse Albums — Rated and Reviewed Records",
  description:
    "Browse albums on Trackboxd with track-by-track ratings, reviews and annotations from listeners.",
  keywords: ["album reviews", "rate albums", "album ratings"],
  alternates: { canonical: `${SITE_URL}/albums` },
  openGraph: {
    title: "Browse Albums on Trackboxd",
    description: "Albums rated and reviewed track by track on Trackboxd.",
    url: `${SITE_URL}/albums`,
  },
};

export default function AlbumsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
