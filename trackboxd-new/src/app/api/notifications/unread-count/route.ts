import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/notifications/unread-count -> { count }
// The header polls this for its badge. It is one count query, instead of
// loading every notification with its users and items like /api/notifications.
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(cookies());
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Unread notification count error:", error);
    return NextResponse.json({ error: "Failed to count notifications" }, { status: 500 });
  }

  return NextResponse.json(
    { count: count ?? 0 },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
