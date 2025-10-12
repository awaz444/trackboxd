import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        // Get the session
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse the request body
        const { isPrivate } = await request.json();

        if (typeof isPrivate !== "boolean") {
            return NextResponse.json(
                { error: "Invalid request body. isPrivate must be a boolean." },
                { status: 400 }
            );
        }

        // Create Supabase client
        const supabase = createClient(cookies());

        // Update the user's profile_private setting
        const { error } = await supabase
            .from("users")
            .update({ profile_private: isPrivate })
            .eq("id", session.user.id);

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to update profile privacy setting" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                message: `Profile privacy ${isPrivate ? 'enabled' : 'disabled'} successfully` 
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Profile privacy update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}