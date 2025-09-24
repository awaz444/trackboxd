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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${lora.className} bg-[#FFFFF0] text-[#1F2C24]`}>
        <SessionProvider>
          <ClientShell>
            {children}
          </ClientShell>
        </SessionProvider>
      </body>
    </html>
  );
}
