import { NextResponse } from "next/server";
import { getGlobalActivity } from "@/lib/global-activity";

// Same data as the logged-out landing's GlobalActivity server component, exposed
// as JSON so the logged-in home can fetch it client-side alongside its other
// section calls. Cached briefly at the edge — the feed is public and shared
// across users.
export const revalidate = 180;

export async function GET() {
  const data = await getGlobalActivity();
  return NextResponse.json(data);
}
