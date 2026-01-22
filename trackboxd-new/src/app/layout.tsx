import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import React from "react";
import ClientShell from "./shell";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// 1. Set your base URL so Next.js can resolve absolute paths for images
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com"), 
  title: {
    default: "Trackboxd",
    template: "%s | Trackboxd", // Adds a nice suffix to inner pages (e.g. "Login | Trackboxd")
  },
  description: "Your music, your words.",
  
  // 2. Explicitly define the favicon
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png", // Or a specific apple-touch-icon.png if you have one
  },

  // 3. Define Open Graph (Facebook, Discord, iMessage, etc)
  openGraph: {
    title: "Trackboxd",
    description: "Your music, your words.",
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
    description: "Your music, your words.",
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
      </head>
      <body className={`${lora.className} bg-[#FFFBEb] text-[#1F2C24]`}>
        <SessionProvider>
          <ClientShell>{children}</ClientShell>
        </SessionProvider>
      </body>
    </html>
  );
}
