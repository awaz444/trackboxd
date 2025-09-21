import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-[#FFFFF0]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-[#0C3B2E] mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-[#0C3B2E] mb-4">Profile Not Found</h2>
          <p className="text-[#A0A0A0] text-lg mb-8">
            The profile you're looking for doesn't exist or has been removed.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-[#0C3B2E] hover:bg-[#1F2C24] text-white">
              Go Home
            </Button>
          </Link>
          <Link href="/songs">
            <Button variant="outline" className="border-[#D9D9D9] bg-[#FFFFF5] text-[#0C3B2E] hover:bg-[#F2F3EF]">
              Browse Songs
            </Button>
          </Link>
        </div>
      </div>
      
      <Footer variant="light" />
    </div>
  );
}
