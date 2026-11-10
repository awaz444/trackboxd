import React from "react";
import { cn } from "@/lib/utils";
import TileRail from "@/components/TileRail";

/**
 * The one loading language for Trackboxd: soft, borderless placeholders in
 * the shape of what is coming. No spinners anywhere.
 *
 * - Content (pages, sections, lists) → the shaped skeletons below.
 * - Actions in progress (like, follow, save, post) → keep the control's
 *   label/icon, disable it and add `pendingClass` so it pulses.
 */

const FILL = "bg-[#5C5537]/10";

/** Pulse class for a button or control whose action is in flight. */
export const pendingClass = "animate-pulse pointer-events-none";

export function Skeleton({ className, rounded = "rounded-md" }: { className?: string; rounded?: string }) {
    return <div aria-hidden className={cn("animate-pulse", FILL, rounded, className)} />;
}

/** Lines of text. The last line is shorter so it reads as a paragraph. */
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div aria-hidden className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={cn("h-3.5", i === lines - 1 && lines > 1 ? "w-2/3" : "w-full")} />
            ))}
        </div>
    );
}

/** A section heading placeholder. */
export function HeadingSkeleton({ className }: { className?: string }) {
    return <Skeleton className={cn("h-7 w-48 mb-5", className)} />;
}

/** One cover tile, matching MediaCard (square cover, title, artist). */
export function TileSkeleton({ poster = false, round = false }: { poster?: boolean; round?: boolean }) {
    return (
        <div aria-hidden>
            {poster ? (
                <div className={cn("relative w-full rounded-xl animate-pulse", FILL)} style={{ paddingBottom: "140%" }} />
            ) : (
                <Skeleton className="aspect-square w-full" rounded={round ? "rounded-full" : "rounded-xl"} />
            )}
            <div className={cn("pt-2.5 space-y-1.5", round && "flex flex-col items-center")}>
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

/** A grid of tiles, e.g. `cols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"`. */
export function TileGridSkeleton({
    count = 4,
    cols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    gap = "gap-4",
    poster = false,
}: {
    count?: number;
    cols?: string;
    gap?: string;
    poster?: boolean;
}) {
    return (
        <div className={cn("grid", cols, gap)}>
            {Array.from({ length: count }).map((_, i) => (
                <TileSkeleton key={i} poster={poster} />
            ))}
        </div>
    );
}

/** A swipe row of tiles on phones, a grid from `sm` up — same as TileRail. */
export function TileRailSkeleton({
    count = 5,
    cols = "sm:grid-cols-3 md:grid-cols-5",
    itemWidth = "w-[42%]",
}: {
    count?: number;
    cols?: string;
    itemWidth?: string;
}) {
    return (
        <TileRail cols={cols} itemWidth={itemWidth}>
            {Array.from({ length: count }).map((_, i) => (
                <TileSkeleton key={i} />
            ))}
        </TileRail>
    );
}

/** A list row: cover or avatar, two lines of text, optional trailing bit. */
export function RowSkeleton({
    media = "square",
    size = "w-14 h-14",
    trailing = false,
    rank = false,
}: {
    media?: "square" | "round" | "none";
    size?: string;
    trailing?: boolean;
    rank?: boolean;
}) {
    return (
        <div aria-hidden className="flex items-center gap-3 py-2.5">
            {rank && <Skeleton className="h-4 w-4 shrink-0" />}
            {media !== "none" && (
                <Skeleton className={cn(size, "shrink-0")} rounded={media === "round" ? "rounded-full" : "rounded-lg"} />
            )}
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
            </div>
            {trailing && <Skeleton className="h-8 w-16 shrink-0" rounded="rounded-full" />}
        </div>
    );
}

export function RowListSkeleton({
    count = 5,
    className,
    ...row
}: { count?: number; className?: string } & React.ComponentProps<typeof RowSkeleton>) {
    return (
        <div className={cn("space-y-1", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <RowSkeleton key={i} {...row} />
            ))}
        </div>
    );
}

/** A review / annotation / activity entry: who, what, and a few lines. */
export function ReviewSkeleton({ cover = true }: { cover?: boolean }) {
    return (
        <div aria-hidden className="py-3 flex gap-4">
            {cover && <Skeleton className="w-16 h-16 shrink-0" rounded="rounded-lg" />}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="w-6 h-6 shrink-0" rounded="rounded-full" />
                    <Skeleton className="h-3.5 w-28" />
                </div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <TextSkeleton lines={2} />
            </div>
        </div>
    );
}

export function ReviewListSkeleton({ count = 3, cover = true, className }: { count?: number; cover?: boolean; className?: string }) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <ReviewSkeleton key={i} cover={cover} />
            ))}
        </div>
    );
}

/** Song / album / playlist page header: big cover, title, meta, action pills. */
export function DetailHeaderSkeleton() {
    return (
        <div aria-hidden className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            <Skeleton className="w-full aspect-square sm:max-w-md sm:mx-auto md:mx-0 md:w-56 md:h-56 shrink-0" rounded="rounded-2xl md:rounded-xl" />
            <div className="flex-1 min-w-0">
                <Skeleton className="h-8 w-3/4 mb-3" />
                <Skeleton className="h-5 w-1/3 mb-6" />
                <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm">
                    <TextSkeleton lines={2} />
                    <TextSkeleton lines={2} />
                </div>
                <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-11 w-24" rounded="rounded-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

/** A profile header: round avatar, name, counts, a button. */
export function ProfileHeaderSkeleton() {
    return (
        <div aria-hidden className="flex flex-col items-center text-center mb-8">
            <Skeleton className="w-24 h-24 md:w-28 md:h-28 mb-4" rounded="rounded-full" />
            <Skeleton className="h-6 w-36 mb-3" />
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-10 w-32" rounded="rounded-full" />
        </div>
    );
}

/** Full-page shell so route-level skeletons share the real page padding. */
export function PageSkeleton({ children, width = "max-w-6xl" }: { children: React.ReactNode; width?: string }) {
    return (
        <div className="min-h-screen bg-[#FFFBEb]" aria-busy="true" aria-label="Loading">
            <main className={cn(width, "mx-auto px-4 pt-4 pb-8 md:py-8")}>{children}</main>
        </div>
    );
}
