import React from "react";
import Footer from "@/components/Footer";
import {
  PageSkeleton,
  ProfileHeaderSkeleton,
  HeadingSkeleton,
  TileGridSkeleton,
  ReviewListSkeleton,
} from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <>
      <PageSkeleton width="max-w-5xl">
        <ProfileHeaderSkeleton />

        {/* Top 4 */}
        <div className="mb-8">
          <HeadingSkeleton />
          <TileGridSkeleton count={4} cols="grid-cols-2 sm:grid-cols-4" />
        </div>

        {/* Activity */}
        <div className="mb-8">
          <HeadingSkeleton />
          <ReviewListSkeleton />
        </div>
      </PageSkeleton>
      <Footer variant="light" />
    </>
  );
}
