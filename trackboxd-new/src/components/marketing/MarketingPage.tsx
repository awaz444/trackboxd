import React from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Shared shell for the editorial landing pages. These are server components on
 * purpose: their whole job is to put crawlable prose in the initial HTML.
 */
export function MarketingPage({
  title,
  tagline,
  children,
  jsonLd,
}: {
  title: string;
  tagline: string;
  children: React.ReactNode;
  jsonLd?: object;
}) {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex flex-col">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <main className="flex-1 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-[#5C5537] mb-2">{title}</h1>
          <p className="text-lg text-[#5C5537]/60 mb-10">{tagline}</p>
          {children}

          <section className="mt-12 pt-8 border-t border-[#5C5537]/15">
            <h2 className="text-xl font-bold text-[#5C5537] mb-3">
              Start your listening diary
            </h2>
            <p className="text-base text-[#5C5537]/80 leading-relaxed mb-4">
              Trackboxd is free to use. Search any track, give it a rating, and
              write the first thing you actually think about it.
            </p>
            <Link
              href="/tracks"
              className="inline-block bg-[#5C5537] text-white py-2 px-5 rounded-md hover:bg-[#3E3725] transition-colors"
            >
              Browse tracks →
            </Link>
          </section>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      {heading && (
        <h2 className="text-xl font-bold text-[#5C5537] mb-4">{heading}</h2>
      )}
      <div className="space-y-4 text-base text-[#5C5537]/80 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/** Renders a Q&A block that mirrors the FAQPage schema on the same page. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-[#5C5537] mb-4">
        Frequently asked questions
      </h2>
      <dl className="space-y-5">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-bold text-[#5C5537] mb-1">{item.q}</dt>
            <dd className="text-base text-[#5C5537]/80 leading-relaxed">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export const faqSchema = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
});
