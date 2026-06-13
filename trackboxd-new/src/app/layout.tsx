import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";
import ClientShell from "./shell";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// 1. Set your base URL so Next.js can resolve absolute paths for images
export const metadata: Metadata = {
  title: {
    default: "Trackboxd — The Letterboxd for Tracks",
    template: "%s | Trackboxd",
  },
  description:
    "Trackboxd is the Letterboxd for tracks. Rate songs, write reviews, annotate lyrics with timestamps, and build a listening diary. The music annotation platform built for people who actually care.",
  keywords: [
    "letterboxd for music",
    "letterboxd for tracks",
    "song annotation",
    "music review platform",
    "track diary",
    "music rating app",
    "song meaning",
    "musicboard alternative",
    "rate your music alternative",
    "social music tracking app",
    "music annotation platform",
    "trackboxd",
  ],
  authors: [
    { name: "Aawaiz Ali", url: "https://www.linkedin.com/in/aawaiz" },
    { name: "Umer Noor", url: "https://www.linkedin.com/in/umer-noor" },
  ],
  creator: "Aawaiz Ali",
  publisher: "Trackboxd",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // 2. Explicitly define the favicon
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png", // Or a specific apple-touch-icon.png if you have one
  },

  // 3. Define Open Graph (Facebook, Discord, iMessage, etc)
  openGraph: {
    title: "Trackboxd — The Letterboxd for Tracks",
    description:
      "Rate songs, write reviews, annotate lyrics with timestamps, and build a listening diary. The music annotation platform built for people who actually care.",
    url: "https://trackboxd.com",
    siteName: "Trackboxd",
    images: [
      {
        url: "/og-image.png", // Must be in public folder
        width: 1200,
        height: 630,
        alt: "Trackboxd Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // 4. Define Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Trackboxd — The Letterboxd for Tracks",
    description:
      "Rate songs, write reviews, annotate lyrics, and build your listening diary. The music annotation platform built for people who actually care.",
    images: ["/og-image.png"],
    site: "@trackboxd",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1F2C24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Trackboxd",
                  alternateName: "The Letterboxd for Tracks",
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com",
                  description:
                    "Trackboxd is the Letterboxd for tracks. Rate songs, write reviews, annotate lyrics with timestamps, and build a listening diary.",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com"}/search?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  name: "Trackboxd",
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com",
                  description:
                    "Trackboxd is a track-first social platform for rating songs, writing reviews, and annotating lyrics.",
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
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${lora.className} bg-[#FFFBEb] text-[#1F2C24]`}>
        <AuthProvider>
          <ClientShell>{children}</ClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
