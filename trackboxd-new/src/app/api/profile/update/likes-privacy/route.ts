import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { isPrivate } = await request.json();
    
    // Update the user's likes_private setting
    const supabase = createClient(cookies());
    const { error } = await supabase
      .from("users")
      .update({ likes_private: isPrivate })
      .eq("id", session.user.id);

    if (error) {
      console.error("Error updating likes privacy:", error);
      return NextResponse.json(
        { error: "Failed to update likes privacy setting" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in likes privacy update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}