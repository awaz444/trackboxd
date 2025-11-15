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

export const metadata: Metadata = {
  title: "Trackboxd",
  description: "Your music, your words.",
  icons: {
    icon: [
      { url: '/trackboxd-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/trackboxd-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/trackboxd-logo.png',
    apple: '/trackboxd-logo.png',
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
        <link rel="apple-touch-icon" href="/trackboxd-logo.png" />
        <link rel="icon" type="image/png" href="/trackboxd-logo.png" />
        <link rel="shortcut icon" href="/trackboxd-logo.png" />
      </head>
      <body className={`${lora.className} bg-[#FFFBEb] text-[#1F2C24]`}>
        <SessionProvider>
          <ClientShell>
            {children}
          </ClientShell>
        </SessionProvider>
      </body>
    </html>
  );
}
