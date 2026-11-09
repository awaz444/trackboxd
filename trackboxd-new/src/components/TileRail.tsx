import React from "react";

interface TileRailProps {
    children: React.ReactNode;
    /** Grid columns from `sm` up, e.g. "sm:grid-cols-3 md:grid-cols-5". */
    cols?: string;
    /** Tile width on phones, as a share of the screen. */
    itemWidth?: string;
}

/**
 * Short rows of cover tiles (5 "similar"/"trending" items, etc.).
 * Phones: a swipe row that bleeds to the screen edge but rests on the
 * page's 16px gutter, so odd counts never leave a lone tile in a 2-col
 * grid. From `sm` up it becomes a normal grid.
 */
export default function TileRail({
    children,
    cols = "sm:grid-cols-3 md:grid-cols-5",
    itemWidth = "w-[42%]",
}: TileRailProps) {
    const items = React.Children.toArray(children).filter(Boolean);
    return (
        <div
            className={`flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-px-4 scrollbar-hide -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:scroll-px-0 sm:overflow-visible sm:grid sm:gap-4 ${cols}`}
        >
            {items.map((child, i) => (
                <div key={(child as React.ReactElement).key ?? i} className={`${itemWidth} shrink-0 snap-start sm:w-auto`}>
                    {child}
                </div>
            ))}
            {/* Some mobile browsers drop a scroller's end padding; this keeps the last tile off the edge. */}
            <div aria-hidden className="w-px shrink-0 sm:hidden" />
        </div>
    );
}
