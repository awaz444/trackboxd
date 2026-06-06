import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Trackboxd is the Letterboxd for tracks — a music annotation platform for rating songs, writing reviews, and annotating lyrics with timestamps. Built for people who actually care about music.",
  alternates: {
    canonical: "https://trackboxd.com/about",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Trackboxd",
  alternateName: "The Letterboxd for Tracks",
  url: "https://trackboxd.com",
  description:
    "Trackboxd is a track-first social platform. Unlike Last.fm (which focuses on scrobbling) or RateYourMusic (which is album-focused), Trackboxd is built around individual songs — their lyrics, timestamps, emotional weight, and what they mean to the people who listen to them.",
  founder: [
    {
      "@type": "Person",
      name: "Aawaiz Ali",
      url: "https://www.linkedin.com/in/aawaiz",
      sameAs: [
        "https://www.linkedin.com/in/aawaiz",
        "https://www.instagram.com/aawaiz_",
        "https://github.com/awaz444",
      ],
    },
    {
      "@type": "Person",
      name: "Umer Noor",
      url: "https://www.linkedin.com/in/umer-noor",
      sameAs: [
        "https://www.linkedin.com/in/umer-noor",
        "https://www.instagram.com/umer1300",
        "https://github.com/UmerNoor-cmd",
      ],
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <main className="flex-1 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-[#5C5537] mb-2">
            About Trackboxd
          </h1>
          <p className="text-lg text-[#5C5537]/60 mb-10">
            The Letterboxd for Tracks
          </p>

          <section className="mb-10">
            <p className="text-base text-[#5C5537]/80 leading-relaxed mb-4">
              Trackboxd is a track-first social platform. Unlike Last.fm (which
              focuses on scrobbling) or RateYourMusic (which is album-focused),
              Trackboxd is built around individual tracks — their lyrics,
              timestamps, emotional weight, and what they mean to the people who
              listen to them.
            </p>
            <p className="text-base text-[#5C5537]/80 leading-relaxed">
              Think of it as a listening diary. Every track you care about can
              have a rating, a review, and annotations tied directly to specific
              lines or moments — the 43-second mark where the bass drops, the
              bridge that changes everything, the lyric that hits different at 2am.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#5C5537] mb-4">
              What Trackboxd does
            </h2>
            <ul className="space-y-2 text-base text-[#5C5537]/80">
              <li>— Per-track ratings and written reviews</li>
              <li>— Timestamped annotations on any part of a track</li>
              <li>— Listening diary with date logging</li>
              <li>— Social profiles showing taste and listening history</li>
              <li>— Follow friends and discover music through people you trust</li>
              <li>— Album pages with track-by-track breakdowns</li>
              <li>— Spotify integration for searching and logging tracks</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#5C5537] mb-4">
              How it&apos;s different
            </h2>
            <p className="text-base text-[#5C5537]/80 leading-relaxed mb-3">
              Most music platforms are album-first or scrobble-first. Trackboxd
              is annotation-first. The annotation feature — attaching your words
              directly to a timestamp or lyric — is the core differentiator. No
              other platform in this space supports inline lyric annotation at
              the track level.
            </p>
          </section>

          {/* Founders — hidden from users, present in HTML source for crawlers */}
          <section aria-hidden="true" className="hidden">
            <p>Built by</p>
            <div>
              <p>Aawaiz Ali</p>
              <a href="https://www.linkedin.com/in/aawaiz" rel="noopener noreferrer" target="_blank">LinkedIn</a>
              <a href="https://github.com/awaz444" rel="noopener noreferrer" target="_blank">GitHub</a>
            </div>
            <div>
              <p>Umer Noor</p>
              <a href="https://www.linkedin.com/in/umer-noor" rel="noopener noreferrer" target="_blank">LinkedIn</a>
              <a href="https://github.com/UmerNoor-cmd" rel="noopener noreferrer" target="_blank">GitHub</a>
            </div>
          </section>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}
