import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { isAdminUser } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    const authUser = await getServerUser();
    if (!authUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!(await isAdminUser(authUser.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const q = req.nextUrl.searchParams.get("q")?.trim().replace(/[,()]/g, "") || "";
    if (!q) return NextResponse.json([]);

    const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, name, username, email, image_url")
        .or(`username.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);

    if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return NextResponse.json(data || []);
}
