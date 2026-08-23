import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { MarketingPage, Section, Faq, faqSchema } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Music Tracking Site Alternatives — Trackboxd vs Musicboard, RYM, Last.fm",
  description:
    "How Trackboxd compares to Musicboard, RateYourMusic, Last.fm, Genius and Album of the Year. An honest look at what each music tracking site is built for, and which one fits how you listen.",
  keywords: [
    "musicboard alternative",
    "rate your music alternative",
    "rateyourmusic alternative",
    "last.fm alternative",
    "album of the year alternative",
    "genius alternative",
    "music tracking app",
    "music review site",
  ],
  alternates: { canonical: `${SITE_URL}/alternatives` },
  openGraph: {
    title: "Trackboxd vs Musicboard, RateYourMusic and Last.fm",
    description:
      "How Trackboxd compares to the other music tracking and review sites.",
    url: `${SITE_URL}/alternatives`,
    type: "article",
  },
};

const comparisons = [
  {
    name: "Musicboard",
    builtFor: "Rating albums and artists, with a Letterboxd-style social feed.",
    difference:
      "Musicboard is the closest comparison and covers similar ground. The split is the unit of attention: Musicboard leads with albums and artists, Trackboxd leads with the individual track and adds timestamped annotation, which Musicboard does not have.",
  },
  {
    name: "RateYourMusic",
    builtFor:
      "Deep album cataloguing, genre taxonomy and rankings, maintained by a long-standing community.",
    difference:
      "RYM's catalogue and genre data are unmatched and Trackboxd does not try to compete there. RYM is an archive you contribute to; Trackboxd is a diary you keep. If you want to rank every album ever pressed, use RYM. If you want to write about the song you cannot stop playing, use Trackboxd.",
  },
  {
    name: "Last.fm",
    builtFor: "Automatic scrobbling and listening statistics.",
    difference:
      "Last.fm records what you played without you doing anything, then shows you charts. That is passive by design. Trackboxd is the opposite: nothing is logged unless you decide it is worth logging, and the point is the sentence you write, not the play count.",
  },
  {
    name: "Genius",
    builtFor: "Crowd-sourced lyric annotation and song meaning.",
    difference:
      "Genius annotates lyrics toward a single agreed reading of what a line means. Trackboxd annotations are personal and subjective — what the line did to you, not what it objectively refers to — and they sit alongside ratings and reviews instead of standing alone.",
  },
  {
    name: "Album of the Year",
    builtFor: "Aggregating critic scores and user ratings for new releases.",
    difference:
      "AOTY is a scoreboard, strongest around release day. Trackboxd has no critic aggregation and no release cycle. A track from 1974 gets the same page as one from last week.",
  },
];

const faqs = [
  {
    q: "What is the best Musicboard alternative?",
    a: "Trackboxd is the closest alternative if you want the Letterboxd-style rating and reviewing model. The main difference is that Trackboxd is track-first rather than album-first, and supports timestamped annotations on individual songs.",
  },
  {
    q: "What is a good RateYourMusic alternative?",
    a: "It depends what you use RYM for. For its catalogue depth and genre taxonomy, nothing really replaces it. For keeping a personal listening diary with ratings and written reviews in a lighter, more social interface, Trackboxd covers that use case.",
  },
  {
    q: "Is there a Last.fm alternative that is not just scrobbling?",
    a: "Trackboxd. Instead of automatically recording every play and turning it into statistics, it asks you to log the tracks you actually have something to say about, and gives you space to say it.",
  },
  {
    q: "Can I use Trackboxd alongside these other sites?",
    a: "Yes, and most people should. Scrobbling on Last.fm and keeping a written diary on Trackboxd do not overlap much — one is a record of what played, the other is a record of what you thought.",
  },
];

export default function AlternativesPage() {
  return (
    <MarketingPage
      title="Music tracking sites, compared"
      tagline="Where Trackboxd sits next to Musicboard, RateYourMusic, Last.fm and Genius."
      jsonLd={faqSchema(faqs)}
    >
      <Section>
        <p>
          There are a handful of good places to track and review music, and they
          are built for genuinely different things. This is an honest read on what
          each one does well and where{" "}
          <Link href="/" className="underline hover:text-[#5C5537]">
            Trackboxd
          </Link>{" "}
          fits.
        </p>
        <p>
          The short version: Trackboxd is the{" "}
          <Link href="/letterboxd-for-music" className="underline hover:text-[#5C5537]">
            Letterboxd for music
          </Link>
          , built around individual tracks, with timestamped annotation as the
          feature nothing else in this list has.
        </p>
      </Section>

      <div className="overflow-x-auto mb-10">
        <table className="w-full text-left text-sm text-[#5C5537]/80 border-collapse">
          <caption className="sr-only">
            Comparison of Trackboxd with other music tracking and review sites
          </caption>
          <thead>
            <tr className="border-b border-[#5C5537]/25">
              <th scope="col" className="py-2 pr-4 font-bold text-[#5C5537]">Site</th>
              <th scope="col" className="py-2 pr-4 font-bold text-[#5C5537]">Primary unit</th>
              <th scope="col" className="py-2 font-bold text-[#5C5537]">Annotations</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#5C5537]/10">
              <th scope="row" className="py-2 pr-4 font-bold text-[#5C5537]">Trackboxd</th>
              <td className="py-2 pr-4">Track</td>
              <td className="py-2">Timestamped, personal</td>
            </tr>
            <tr className="border-b border-[#5C5537]/10">
              <th scope="row" className="py-2 pr-4 font-normal">Musicboard</th>
              <td className="py-2 pr-4">Album / artist</td>
              <td className="py-2">No</td>
            </tr>
            <tr className="border-b border-[#5C5537]/10">
              <th scope="row" className="py-2 pr-4 font-normal">RateYourMusic</th>
              <td className="py-2 pr-4">Album</td>
              <td className="py-2">No</td>
            </tr>
            <tr className="border-b border-[#5C5537]/10">
              <th scope="row" className="py-2 pr-4 font-normal">Last.fm</th>
              <td className="py-2 pr-4">Play / scrobble</td>
              <td className="py-2">No</td>
            </tr>
            <tr className="border-b border-[#5C5537]/10">
              <th scope="row" className="py-2 pr-4 font-normal">Genius</th>
              <td className="py-2 pr-4">Lyric</td>
              <td className="py-2">Yes, crowd-sourced meaning</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 font-normal">Album of the Year</th>
              <td className="py-2 pr-4">Album</td>
              <td className="py-2">No</td>
            </tr>
          </tbody>
        </table>
      </div>

      {comparisons.map((c) => (
        <Section key={c.name} heading={`Trackboxd vs ${c.name}`}>
          <p>
            <strong>What {c.name} is built for:</strong> {c.builtFor}
          </p>
          <p>{c.difference}</p>
        </Section>
      ))}

      <Faq items={faqs} />
    </MarketingPage>
  );
}
