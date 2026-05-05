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
    default: "Trackboxd",
    template: "%s | Trackboxd", // Adds a nice suffix to inner pages (e.g. "Login | Trackboxd")
  },
  description: "Your music, your words. Share reviews, annotations, and connect with other music lovers on Trackboxd.",
  keywords: ["music reviews", "trackboxd", "music annotations", "social music platform", "share music taste", "spotify integration", "music community"],
  authors: [{ name: "Trackboxd Team" }, { name: "Aawaiz Ali" }, { name: "Umer Noor" }],
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
    title: "Trackboxd",
    description: "Your music, your words. Share reviews, annotations, and connect with other music lovers.",
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
    title: "Trackboxd",
    description: "Your music, your words. Share reviews, annotations, and connect with other music lovers.",
    images: ["/og-image.png"], // Must be in public folder
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
              "@type": "WebSite",
              name: "Trackboxd",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com",
              description: "Your music, your words. Share reviews, annotations, and connect with other music lovers on Trackboxd.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com"}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
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
