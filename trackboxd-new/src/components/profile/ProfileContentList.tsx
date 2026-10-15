import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfileReviewCard from "@/components/profile/ProfileReviewCard";
import ProfileAnnotationCard from "@/components/profile/ProfileAnnotationCard";
import ProfilePagination from "@/components/profile/ProfilePagination";
import type { ProfileContentPage } from "@/lib/profile-service";

interface Props {
  username: string;
  kind: "review" | "annotation";
  data: ProfileContentPage;
}

export default function ProfileContentList({ username, kind, data }: Props) {
  const label = kind === "review" ? "Reviews" : "Annotations";
  const base = `/profile/${username}/${kind === "review" ? "reviews" : "annotations"}`;

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/profile/${username}`}
          className="inline-flex items-center gap-1 text-sm text-[#5C5537]/70 hover:text-[#5C5537] mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {data.user.name}&apos;s profile
        </Link>
        <h1 className="text-3xl font-bold text-[#5C5537] mb-1">
          {data.user.name}&apos;s {label}
        </h1>

        {data.hidden ? (
          <p className="text-[#5C5537]/70 mt-6">This account is private.</p>
        ) : (
          <>
            <p className="text-[#5C5537]/70 mb-6">
              {data.total} {kind}
              {data.total !== 1 ? "s" : ""}
            </p>
            {data.items.length === 0 ? (
              <p className="text-[#5C5537]/70">Nothing here yet.</p>
            ) : (
              <div className="space-y-3">
                {data.items.map((item) =>
                  kind === "review" ? (
                    <ProfileReviewCard key={item.id} review={item as any} />
                  ) : (
                    <ProfileAnnotationCard key={item.id} annotation={item as any} />
                  )
                )}
              </div>
            )}

            <ProfilePagination base={base} page={data.page} totalPages={data.totalPages} />
          </>
        )}
      </div>
    </div>
  );
}
