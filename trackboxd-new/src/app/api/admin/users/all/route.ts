import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { isAdminUser } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/admin/users/all — full recipient list for the admin email composer.
export async function GET() {
    const authUser = await getServerUser();
    if (!authUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!(await isAdminUser(authUser.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users: { id: string; name: string; username: string | null; email: string }[] = [];
    const PAGE_SIZE = 1000;
    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("id, name, username, email")
            .not("email", "is", null)
            .range(from, from + PAGE_SIZE - 1);

        if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        if (!data || data.length === 0) break;
        users.push(...data);
        if (data.length < PAGE_SIZE) break;
    }

    return NextResponse.json(users);
}
