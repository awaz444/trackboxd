import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { getProfileFollowingPage } from "@/lib/profile-service";
import ProfileFollowingList from "@/components/profile/ProfileFollowingList";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { username: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `${username} — Following · Trackboxd`,
    robots: { index: false, follow: true },
  };
}

export default async function ProfileFollowingPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const sp = await searchParams;
  const currentUser = await getServerUser();
  const page = Number.parseInt(sp?.page ?? "1", 10) || 1;
  const data = await getProfileFollowingPage(username, page, currentUser?.id ?? null);
  if (!data) notFound();
  return <ProfileFollowingList username={username} data={data} />;
}
