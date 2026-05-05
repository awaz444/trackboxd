import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function handleLogout() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Logout successful" }, { status: 200 });
}

export async function POST() {
  try {
    return await handleLogout();
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

export async function GET() {
  try {
    return await handleLogout();
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
