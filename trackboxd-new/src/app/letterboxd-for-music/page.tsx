import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { MarketingPage, Section, Faq, faqSchema } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Letterboxd for Music — Rate and Review Songs on Trackboxd",
  description:
    "Looking for a Letterboxd for music? Trackboxd is the Letterboxd for tracks: rate songs out of five, write reviews, annotate lyrics with timestamps, and keep a listening diary of everything you hear.",
  keywords: [
    "letterboxd for music",
    "letterboxd for songs",
    "letterboxd but for music",
    "letterboxd for tracks",
    "music version of letterboxd",
    "rate and review songs",
  ],
  alternates: { canonical: `${SITE_URL}/letterboxd-for-music` },
  openGraph: {
    title: "Letterboxd for Music — Trackboxd",
    description:
      "Trackboxd is the Letterboxd for tracks. Rate songs, write reviews, annotate lyrics, and build a listening diary.",
    url: `${SITE_URL}/letterboxd-for-music`,
    type: "article",
  },
};

const faqs = [
  {
    q: "Is there a Letterboxd for music?",
    a: "Yes — Trackboxd. It applies the Letterboxd model to music: you rate a track out of five stars, write a review in your own words, log the date you listened, and build a public profile that shows your taste over time. The difference is the unit. Letterboxd is built around films; Trackboxd is built around individual tracks rather than whole albums.",
  },
  {
    q: "How is Trackboxd different from Letterboxd?",
    a: "The structure is the same — rate, review, log, follow — but Trackboxd adds timestamped annotations. You can attach a comment to a specific moment in a song, like the point where the bridge changes or the lyric in the second verse. Films do not really need that; songs do.",
  },
  {
    q: "Is Trackboxd free?",
    a: "Yes. Creating an account, rating tracks, writing reviews, annotating songs, and following other listeners are all free.",
  },
  {
    q: "Does Trackboxd work with Spotify?",
    a: "Trackboxd uses Spotify's catalogue to search and identify tracks, so you can find effectively any song and log it. Each track page also links out to the song on Spotify.",
  },
  {
    q: "How is it different from Last.fm?",
    a: "Last.fm is built on scrobbling — it automatically records what you play and turns it into listening statistics. Trackboxd is built on writing. It cares about what you thought of a track, not just how many times it went past your ears.",
  },
];

export default function LetterboxdForMusicPage() {
  return (
    <MarketingPage
      title="The Letterboxd for Music"
      tagline="Rate songs, write reviews, annotate lyrics, keep a listening diary."
      jsonLd={faqSchema(faqs)}
    >
      <Section>
        <p>
          If you have ever finished an album and wished for somewhere to put your
          thoughts the way Letterboxd holds your thoughts on films — that is what{" "}
          <strong>Trackboxd</strong> is. It is the Letterboxd for music, built
          around the track rather than the album.
        </p>
        <p>
          You search for a song, give it a rating out of five, and write what you
          actually think. It goes into your diary, appears on your profile, and
          shows up in the feeds of people who follow you.
        </p>
      </Section>

      <Section heading="Why tracks and not albums">
        <p>
          Most music sites are album-first. That works for records you sit down
          with front to back, but it is a poor fit for how a lot of listening
          works now. A great album can carry a song you skip every time; a
          mediocre record can carry the one song you have played four hundred
          times.
        </p>
        <p>
          Trackboxd rates the track. Albums still have their own pages with a
          track-by-track breakdown, but the rating, the review, and the
          annotation all live at the level of the individual song.
        </p>
      </Section>

      <Section heading="What you can do on Trackboxd">
        <ul className="space-y-2">
          <li>— Rate any track out of five stars</li>
          <li>— Write a review and have it appear on the track&apos;s page</li>
          <li>
            — Annotate a specific timestamp or lyric, so your note is attached to
            the exact moment it is about
          </li>
          <li>— Keep a listening diary of what you played and when</li>
          <li>— Follow other listeners and read their reviews as they post</li>
          <li>— Build a public profile that shows your taste rather than describing it</li>
        </ul>
      </Section>

      <Section heading="Annotation is the part nothing else does">
        <p>
          Rating and reviewing are table stakes. The thing Trackboxd has that
          comparable sites do not is inline annotation at the track level. You can
          mark the 43-second mark where the bass drops, or the line in the second
          verse that means something different once you know what the record is
          about, and leave your reading of it there for anyone who opens the song.
        </p>
        <p>
          Lyrics sites annotate meaning. Review sites hold opinions. Trackboxd puts
          both on the same page, attached to the same song.
        </p>
      </Section>

      <Faq items={faqs} />

      <Section>
        <p>
          Compare Trackboxd with other music tracking sites on the{" "}
          <Link href="/alternatives" className="underline hover:text-[#5C5537]">
            alternatives page
          </Link>
          , or read more about the project on the{" "}
          <Link href="/about" className="underline hover:text-[#5C5537]">
            about page
          </Link>
          .
        </p>
      </Section>
    </MarketingPage>
  );
}
