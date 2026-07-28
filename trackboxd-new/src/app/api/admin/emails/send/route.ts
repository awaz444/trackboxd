import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { isAdminUser } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildCustomEmail, sendCustomEmailBatch } from "@/lib/email";

type Recipient =
    | { type: "user"; id: string }
    | { type: "email"; email: string; name?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
    const authUser = await getServerUser();
    if (!authUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!(await isAdminUser(authUser.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const { subject, heading, message, ctaText, ctaUrl, recipients } = body as {
        subject?: string;
        heading?: string;
        message?: string;
        ctaText?: string;
        ctaUrl?: string;
        recipients?: Recipient[];
    };

    if (!subject?.trim() || !heading?.trim() || !message?.trim()) {
        return NextResponse.json({ error: "Subject, heading, and message are required" }, { status: 400 });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }
    if (recipients.length > 500) {
        return NextResponse.json({ error: "Too many recipients (max 500 per send)" }, { status: 400 });
    }

    const userIds = recipients.filter((r): r is { type: "user"; id: string } => r.type === "user").map((r) => r.id);

    let resolvedUsers: { id: string; email: string; name: string; username: string | null }[] = [];
    if (userIds.length > 0) {
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("id, email, name, username")
            .in("id", userIds);
        if (error) return NextResponse.json({ error: "Failed to resolve user recipients" }, { status: 500 });
        resolvedUsers = data || [];
    }

    const manualRecipients = recipients.filter(
        (r): r is { type: "email"; email: string; name?: string } => r.type === "email"
    );
    for (const r of manualRecipients) {
        if (!EMAIL_RE.test(r.email.trim())) {
            return NextResponse.json({ error: `Invalid email address: ${r.email}` }, { status: 400 });
        }
    }

    const targets = new Map<string, string>(); // email -> name
    resolvedUsers.forEach((u) => {
        if (u.email) targets.set(u.email.toLowerCase(), u.username || u.name);
    });
    manualRecipients.forEach((r) => {
        const email = r.email.trim().toLowerCase();
        if (!targets.has(email)) targets.set(email, r.name?.trim() || email);
    });

    if (targets.size === 0) {
        return NextResponse.json({ error: "No valid recipients resolved" }, { status: 400 });
    }

    const items = Array.from(targets.entries()).map(([toEmail, toName]) => ({
        toEmail,
        toName,
        subject: subject.trim(),
        html: buildCustomEmail(heading.trim(), message, ctaText?.trim(), ctaUrl?.trim()),
    }));

    const results = await sendCustomEmailBatch(items);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
        sent: results.length - failed.length,
        failed: failed.length,
        failures: failed,
    });
}
