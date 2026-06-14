"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface JournalCoverProps {
    coverUrl?: string | null;
    trackCovers?: (string | null | undefined)[];
    title: string;
    iconClassName?: string;
}

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/default-album.jpg";
};

const JournalCover: React.FC<JournalCoverProps> = ({
    coverUrl,
    trackCovers = [],
    title,
    iconClassName = "w-12 h-12",
}) => {
    if (coverUrl) {
        return (
            <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={handleImgError}
            />
        );
    }

    const images = trackCovers.filter((c): c is string => !!c);

    if (images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <BookOpen className={`${iconClassName} text-[#5C5537]/30`} />
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <img
                src={images[0]}
                alt={title}
                className="w-full h-full object-cover"
                onError={handleImgError}
            />
        );
    }

    const cells = images.slice(0, 4);
    return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
            {Array.from({ length: 4 }).map((_, i) =>
                cells[i] ? (
                    <img
                        key={i}
                        src={cells[i]}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={handleImgError}
                    />
                ) : (
                    <div key={i} className="w-full h-full bg-[#5C5537]/5" />
                )
            )}
        </div>
    );
};

export default JournalCover;
