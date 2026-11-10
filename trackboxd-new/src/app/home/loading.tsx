import {
    PageSkeleton,
    HeadingSkeleton,
    TileRailSkeleton,
    RowListSkeleton,
    ReviewListSkeleton,
} from "@/components/ui/skeleton";

export default function HomeLoading() {
    return (
        <PageSkeleton>
            <HeadingSkeleton />
            <div className="mb-10"><TileRailSkeleton count={4} cols="sm:grid-cols-4" /></div>
            <HeadingSkeleton />
            <div className="mb-10 md:hidden"><RowListSkeleton count={5} rank /></div>
            <div className="mb-10 hidden md:block"><TileRailSkeleton count={5} /></div>
            <HeadingSkeleton />
            <ReviewListSkeleton count={3} />
        </PageSkeleton>
    );
}
