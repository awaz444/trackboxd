import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Browse Playlists",
  description:
    "Playlists shared and liked by listeners on Trackboxd.",
  alternates: { canonical: `${SITE_URL}/playlists` },
  openGraph: {
    title: "Browse Playlists on Trackboxd",
    description: "Playlists shared and liked by listeners on Trackboxd.",
    url: `${SITE_URL}/playlists`,
  },
};

export default function PlaylistsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
