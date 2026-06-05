"use client";

import HomeSectionHeader from "./HomeSectionHeader";
import SuggestedUsers from "@/components/activity/SuggestedUsers";

interface User {
  id: string;
  name: string;
  username: string;
  image_url?: string;
  mutual_connections?: number;
}

interface Props {
  data: User[];
}

export default function PeopleYouMayKnow({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <section className="mb-10">
      <HomeSectionHeader
        title="People You May Know"
        subtitle="Based on mutual connections"
      />
      <SuggestedUsers users={data} />
    </section>
  );
}
