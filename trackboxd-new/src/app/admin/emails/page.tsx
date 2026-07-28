"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, Send, Loader2, Check, UserPlus } from "lucide-react";

interface UserResult {
    id: string;
    name: string;
    username: string;
    email: string;
    image_url?: string | null;
}

type Recipient =
    | { type: "user"; id: string; label: string }
    | { type: "email"; email: string; label: string };

export default function AdminEmailsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const isAdmin = user?.username?.toLowerCase() === "aawaiz";

    useEffect(() => {
        if (!authLoading && !isAdmin) router.replace("/");
    }, [authLoading, isAdmin, router]);

    const [subject, setSubject] = useState("");
    const [heading, setHeading] = useState("");
    const [message, setMessage] = useState("");
    const [ctaText, setCtaText] = useState("View on Trackboxd");
    const [ctaUrl, setCtaUrl] = useState("https://www.trackboxd.com");

    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [userQuery, setUserQuery] = useState("");
    const [userResults, setUserResults] = useState<UserResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [manualEmail, setManualEmail] = useState("");

    const [showConfirm, setShowConfirm] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number; failures?: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const handleUserQueryChange = (value: string) => {
        setUserQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!value.trim()) {
            setUserResults([]);
            return;
        }
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(value)}`);
                const data = await res.json();
                setUserResults(Array.isArray(data) ? data : []);
            } catch {
                setUserResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const addUserRecipient = (u: UserResult) => {
        if (recipients.some((r) => r.type === "user" && r.id === u.id)) return;
        setRecipients((prev) => [...prev, { type: "user", id: u.id, label: `${u.username || u.name} <${u.email}>` }]);
        setUserQuery("");
        setUserResults([]);
    };

    const addManualEmail = () => {
        const email = manualEmail.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        if (recipients.some((r) => r.type === "email" && r.email.toLowerCase() === email.toLowerCase())) return;
        setRecipients((prev) => [...prev, { type: "email", email, label: email }]);
        setManualEmail("");
    };

    const removeRecipient = (index: number) => {
        setRecipients((prev) => prev.filter((_, i) => i !== index));
    };

    const canSend = subject.trim() && heading.trim() && message.trim() && recipients.length > 0;

    const handleSend = async () => {
        setIsSending(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/emails/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    heading,
                    message,
                    ctaText: ctaText.trim() || undefined,
                    ctaUrl: ctaUrl.trim() || undefined,
                    recipients: recipients.map((r) =>
                        r.type === "user" ? { type: "user", id: r.id } : { type: "email", email: r.email }
                    ),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send");
            setResult(data);
            setShowConfirm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send");
            setShowConfirm(false);
        } finally {
            setIsSending(false);
        }
    };

    if (authLoading || !isAdmin) {
        return <div className="min-h-screen bg-[#FFFBEb]" />;
    }

    const previewParagraphs = message
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((p, i) => (
            <p key={i} className="text-[#5C5537] text-[15px] leading-relaxed mb-4 text-center whitespace-pre-line">
                {p}
            </p>
        ));

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-[#5C5537] mb-1">Compose email</h1>
            <p className="text-sm text-[#5C5537]/60 mb-8">
                Send a branded Trackboxd email to users or any address you choose.
            </p>

            {result && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    Sent to {result.sent} recipient{result.sent === 1 ? "" : "s"}.
                    {result.failed > 0 && ` ${result.failed} failed.`}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Compose form */}
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[#5C5537] mb-1.5">Subject line</label>
                        <input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. What's new on Trackboxd"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#5C5537] mb-1.5">Heading</label>
                        <input
                            value={heading}
                            onChange={(e) => setHeading(e.target.value)}
                            placeholder="e.g. Big update to Journals"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#5C5537] mb-1.5">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            placeholder="Write your email... separate paragraphs with a blank line."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40 resize-y"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[#5C5537] mb-1.5">Button text (optional)</label>
                            <input
                                value={ctaText}
                                onChange={(e) => setCtaText(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#5C5537] mb-1.5">Button link</label>
                            <input
                                value={ctaUrl}
                                onChange={(e) => setCtaUrl(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                            />
                        </div>
                    </div>

                    {/* Recipients */}
                    <div>
                        <label className="block text-sm font-medium text-[#5C5537] mb-1.5">Recipients</label>

                        {recipients.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {recipients.map((r, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 text-xs bg-[#5C5537]/10 text-[#5C5537] px-2.5 py-1 rounded-full"
                                    >
                                        {r.label}
                                        <button onClick={() => removeRecipient(i)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5537]/40" />
                            <input
                                value={userQuery}
                                onChange={(e) => handleUserQueryChange(e.target.value)}
                                placeholder="Search users by name, username, or email..."
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                            />
                            {userQuery.trim() && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg shadow-lg z-20 overflow-hidden max-h-64 overflow-y-auto">
                                    {isSearching ? (
                                        <p className="text-xs text-[#5C5537]/50 text-center py-3">Searching...</p>
                                    ) : userResults.length > 0 ? (
                                        <div className="divide-y divide-[#5C5537]/10">
                                            {userResults.map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => addUserRecipient(u)}
                                                    className="w-full flex items-center gap-2.5 p-2 hover:bg-[#5C5537]/5 text-left"
                                                >
                                                    {u.image_url ? (
                                                        <img src={u.image_url} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[#5C5537]/10 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[#5C5537] truncate">{u.username || u.name}</p>
                                                        <p className="text-xs text-[#5C5537]/50 truncate">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[#5C5537]/50 text-center py-3">No users found.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManualEmail())}
                                placeholder="Or add any email address..."
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#5C5537]/20 bg-[#FFFBEb] text-[#5C5537] focus:outline-none focus:ring-1 focus:ring-[#5C5537]/40"
                            />
                            <button
                                onClick={addManualEmail}
                                className="flex items-center gap-1 text-xs font-medium border border-[#5C5537]/20 text-[#5C5537] px-3 py-2 rounded-lg hover:bg-[#5C5537]/5"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Add
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={!canSend}
                        className="flex items-center justify-center gap-2 w-full bg-[#5C5537] text-white font-medium text-sm py-2.5 rounded-lg disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" />
                        Send to {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
                    </button>
                </div>

                {/* Live preview */}
                <div>
                    <p className="text-sm font-medium text-[#5C5537] mb-1.5">Preview</p>
                    <div className="bg-[#FFFBEb] border border-[#5C5537]/10 rounded-xl p-6">
                        <div className="max-w-[420px] mx-auto bg-[#FFFFF5] border border-[#E5DFC0] rounded-2xl p-8">
                            <div className="text-center mb-6">
                                <img src="/trackboxd-logo.png" alt="Trackboxd" className="h-8 w-auto inline-block" />
                            </div>
                            <p className="text-[#5C5537] text-lg font-bold mb-5 text-center" style={{ fontFamily: "Lora, Georgia, serif" }}>
                                {heading || "Your heading here"}
                            </p>
                            <div style={{ fontFamily: "Lora, Georgia, serif" }}>
                                {previewParagraphs.length > 0 ? previewParagraphs : (
                                    <p className="text-[#5C5537]/40 text-[15px] text-center mb-4">Your message will appear here...</p>
                                )}
                            </div>
                            {ctaText.trim() && (
                                <div className="block text-center bg-[#5C5537] text-[#FFFBEb] font-bold text-sm py-3.5 px-6 rounded-lg mt-3">
                                    {ctaText}
                                </div>
                            )}
                            <div className="mt-8 pt-5 border-t border-[#E5DFC0]">
                                <p className="text-[#5C5537] text-xs text-center">
                                    You're receiving this because someone interacted with your content on Trackboxd.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#FFFBEb] rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-[#5C5537] text-lg mb-2">Send this email?</h3>
                        <p className="text-sm text-[#5C5537]/70 mb-5">
                            This will send a real email to {recipients.length} recipient{recipients.length === 1 ? "" : "s"} right now. This can't be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isSending}
                                className="flex-1 py-2 text-sm border border-[#5C5537]/20 rounded-lg text-[#5C5537]/70 hover:bg-[#5C5537]/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={isSending}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-[#5C5537] text-white rounded-lg hover:bg-[#3E3725] disabled:opacity-50"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {isSending ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
