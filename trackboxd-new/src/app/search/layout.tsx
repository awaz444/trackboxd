import type { Metadata } from "next";

// Internal search result pages are near-infinite and hold no unique content, so
// they stay out of the index. Links on them are still worth following.
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
