"use client";

import React from "react";

// Client component so the image-fallback handler can live here while the
// activity grid itself stays a server component (no handlers across the boundary).
export default function ActivityAvatar({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/default-avatar.jpg";
      }}
    />
  );
}
