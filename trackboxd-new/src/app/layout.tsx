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
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
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
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
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
