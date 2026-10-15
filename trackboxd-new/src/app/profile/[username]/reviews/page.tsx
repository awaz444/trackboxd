import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { getProfileContentPage } from "@/lib/profile-service";
import ProfileContentList from "@/components/profile/ProfileContentList";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { username: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `${username}'s Reviews — Trackboxd`,
    robots: { index: false, follow: true },
  };
}

export default async function ProfileReviewsPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const sp = await searchParams;
  const currentUser = await getServerUser();
  const page = Number.parseInt(sp?.page ?? "1", 10) || 1;
  const data = await getProfileContentPage(username, "review", page, currentUser?.id ?? null);
  if (!data) notFound();
  return <ProfileContentList username={username} kind="review" data={data} />;
}
