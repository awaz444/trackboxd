import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function handleLogout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  // Determine the correct NextAuth session cookie name based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const sessionCookieName = isProduction 
    ? "__Secure-next-auth.session-token" 
    : "next-auth.session-token";

  // Clear all authentication-related cookies
  const cookiesToClear = [
    'token',
    sessionCookieName,
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
    '__Secure-next-auth.callback-url'
  ];

  const clearCookieHeaders = cookiesToClear.map(cookieName => 
    `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(0).toUTCString()}; ${isProduction ? 'Secure;' : ''}`
  );

  return NextResponse.json(
    { message: "Logout successful" },
    { 
      status: 200,
      headers: new Headers(
        clearCookieHeaders.map(cookie => ['Set-Cookie', cookie])
      )
    }
  );
}

export async function POST() {
  try {
    return await handleLogout();
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

// Add GET handler
export async function GET() {
  try {
    return await handleLogout();
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}