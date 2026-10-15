import React from "react";
import Link from "next/link";

interface Props {
  base: string;
  page: number;
  totalPages: number;
}

export default function ProfilePagination({ base, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between mt-8 text-[#5C5537]">
      {page > 1 ? (
        <Link href={`${base}?page=${page - 1}`} className="underline">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-[#5C5537]/70">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`${base}?page=${page + 1}`} className="underline">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
