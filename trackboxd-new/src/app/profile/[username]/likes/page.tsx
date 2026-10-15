import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { getProfileLikesPage } from "@/lib/profile-service";
import ProfileLikesList from "@/components/profile/ProfileLikesList";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { username: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `${username} — Likes · Trackboxd`,
    robots: { index: false, follow: true },
  };
}

export default async function ProfileLikesPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const sp = await searchParams;
  const currentUser = await getServerUser();
  const page = Number.parseInt(sp?.page ?? "1", 10) || 1;
  const data = await getProfileLikesPage(username, page, currentUser?.id ?? null);
  if (!data) notFound();
  return <ProfileLikesList username={username} data={data} />;
}
