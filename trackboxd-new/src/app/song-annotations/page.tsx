import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { MarketingPage, Section, Faq, faqSchema } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Song Annotations — Annotate Lyrics and Meaning by Timestamp",
  description:
    "Annotate any song on Trackboxd. Attach your notes to a specific timestamp or lyric, explain what a line means to you, and read what other listeners heard in the same moment.",
  keywords: [
    "music annotation platform",
    "song annotation",
    "annotate lyrics",
    "song meaning website",
    "what does this song mean",
    "lyric annotation site",
    "timestamped song notes",
  ],
  alternates: { canonical: `${SITE_URL}/song-annotations` },
  openGraph: {
    title: "Song Annotations on Trackboxd",
    description:
      "Attach notes to a specific timestamp or lyric in any song, and read what other listeners heard.",
    url: `${SITE_URL}/song-annotations`,
    type: "article",
  },
};

const faqs = [
  {
    q: "What is a song annotation?",
    a: "On Trackboxd, an annotation is a note attached to a specific point in a song — a timestamp, a lyric, or a section. Instead of writing one review about the whole track, you can leave a comment on the exact moment you are talking about, and it appears there for anyone else who opens the song.",
  },
  {
    q: "How do I annotate a song?",
    a: "Open any track page on Trackboxd, choose Annotate, set the timestamp you want the note attached to, and write it. The annotation appears on the track page alongside everyone else's, ordered so you can read through the song moment by moment.",
  },
  {
    q: "Is this the same as Genius?",
    a: "No. Genius annotations aim at a single agreed explanation of what a lyric refers to. Trackboxd annotations are personal readings — what the moment did to you — and they sit next to ratings and reviews of the same track rather than existing on their own.",
  },
  {
    q: "Can I annotate any song?",
    a: "Any track in the Spotify catalogue can be found and annotated, which in practice means effectively any commercially released song.",
  },
  {
    q: "Are annotations public?",
    a: "You choose. Annotations can be public, in which case they appear on the track page and in the feeds of people who follow you, or kept private to your own account.",
  },
];

export default function SongAnnotationsPage() {
  return (
    <MarketingPage
      title="Song annotations"
      tagline="Attach your notes to the exact moment they are about."
      jsonLd={faqSchema(faqs)}
    >
      <Section>
        <p>
          A review covers a whole song. But most of what people actually want to
          say about music is about a moment — the drum fill going into the last
          chorus, the line in the second verse that lands differently once you
          know what the record is about, the eight seconds of silence before the
          outro.
        </p>
        <p>
          Trackboxd annotations attach your note to that moment. You set a
          timestamp, write what you heard, and it stays there on the track page
          for anyone who opens the song.
        </p>
      </Section>

      <Section heading="How annotation works">
        <ul className="space-y-2">
          <li>— Open any track page and choose Annotate</li>
          <li>— Set the timestamp the note belongs to</li>
          <li>— Write your reading of that moment or lyric</li>
          <li>
            — Publish it publicly, so it appears on the track page for other
            listeners, or keep it private to your own account
          </li>
        </ul>
      </Section>

      <Section heading="Meaning is not the same as explanation">
        <p>
          Lyric sites answer &ldquo;what does this line refer to&rdquo; and settle
          on one answer. That is useful, and it is a different job from the one
          annotations do here.
        </p>
        <p>
          A Trackboxd annotation is allowed to be subjective. Two people can
          annotate the same bar with completely different readings and both stay
          up, because the interesting thing about a song is rarely that everyone
          agrees on it.
        </p>
      </Section>

      <Section heading="Annotations, ratings and reviews on one page">
        <p>
          Every track page carries all three: the rating distribution, the written
          reviews, and the annotations in time order. You can see how a song
          scored, read what people thought of it overall, and then go through it
          moment by moment — without leaving the page.
        </p>
        <p>
          Read more about the wider idea on the{" "}
          <Link href="/letterboxd-for-music" className="underline hover:text-[#5C5537]">
            Letterboxd for music
          </Link>{" "}
          page, or see how Trackboxd compares to{" "}
          <Link href="/alternatives" className="underline hover:text-[#5C5537]">
            other music sites
          </Link>
          .
        </p>
      </Section>

      <Faq items={faqs} />
    </MarketingPage>
  );
}
