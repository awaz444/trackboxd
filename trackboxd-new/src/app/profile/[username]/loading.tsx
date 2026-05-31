import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      {/* <Header /> */}
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Profile Header Skeleton */}
          <div className="flex flex-col items-center md:flex-row gap-8 mb-8">
            <div className="rounded-full bg-[#5C5537]/10 h-32 w-32 md:h-40 md:w-40"></div>
            <div className="flex-1 w-full">
              <div className="h-8 bg-[#5C5537]/10 rounded w-48 mb-4"></div>
              <div className="h-4 bg-[#5C5537]/10 rounded w-32 mb-6"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#5C5537]/10 rounded-lg h-20"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Favorite Tracks Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-[#5C5537]/10 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#5C5537]/10 rounded-lg aspect-square"></div>
              ))}
            </div>
          </div>
          
          {/* Activity Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#5C5537]/10 rounded-lg h-16"></div>
                ))}
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#5C5537]/10 rounded-lg h-16"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer variant="light" />
    </div>
  );
}

