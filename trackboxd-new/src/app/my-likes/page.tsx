import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Your likes live on your profile; this route just sends you there.
export default async function MyLikesPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const supabase = createClient(cookies());
  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  if (!profile?.name) redirect("/");
  redirect(`/profile/${profile.name}/likes`);
}
