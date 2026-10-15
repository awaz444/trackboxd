"use client";

import React from "react";
import { Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder: string;
  sort: string;
  onSortChange: (v: string) => void;
  sortOptions: Option[];
  filter?: string;
  onFilterChange?: (v: string) => void;
  filterOptions?: Option[];
}

const selectClass =
  "bg-white/70 border border-[#5C5537]/20 rounded-full px-3 py-2 text-sm text-[#5C5537] focus:outline-none focus:ring-2 focus:ring-[#5C5537]/30";

export default function ListControls({
  query,
  onQueryChange,
  placeholder,
  sort,
  onSortChange,
  sortOptions,
  filter,
  onFilterChange,
  filterOptions,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5537]/50" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/70 border border-[#5C5537]/20 rounded-full pl-9 pr-3 py-2 text-sm text-[#5C5537] placeholder:text-[#5C5537]/50 focus:outline-none focus:ring-2 focus:ring-[#5C5537]/30"
        />
      </div>
      {filterOptions && onFilterChange && (
        <select value={filter} onChange={(e) => onFilterChange(e.target.value)} className={selectClass} aria-label="Filter">
          {filterOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={selectClass} aria-label="Sort">
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
