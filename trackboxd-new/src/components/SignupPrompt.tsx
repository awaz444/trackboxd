"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Invitation to join, shown only to logged-out visitors (search traffic lands
 * on song and review pages). Opens the signup form via `/?auth=signup`.
 */
export default function SignupPrompt({
  heading,
  body,
  cta = "Create your free account",
  className = "",
}: {
  heading: string;
  body: string;
  cta?: string;
  className?: string;
}) {
  const { user, loading } = useAuth();
  if (loading || user) return null;

  return (
    <div
      className={`rounded-xl border border-[#5C5537]/20 bg-[#5C5537]/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#5C5537]">{heading}</p>
        <p className="text-sm text-[#5C5537]/70 mt-1">{body}</p>
      </div>
      <Link
        href="/?auth=signup"
        className="inline-block text-center bg-[#5C5537] text-white text-sm py-2 px-4 rounded-md hover:bg-[#3E3725] transition-colors flex-shrink-0"
      >
        {cta}
      </Link>
    </div>
  );
}
