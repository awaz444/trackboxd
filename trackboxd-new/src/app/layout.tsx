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
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
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
          <ClientShell>
            {children}
          </ClientShell>
        </SessionProvider>
      </body>
    </html>
  );
}
