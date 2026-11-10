import {
    PageSkeleton,
    Skeleton,
    HeadingSkeleton,
    TileGridSkeleton,
    ReviewListSkeleton,
} from "@/components/ui/skeleton";

export default function TracksLoading() {
    return (
        <PageSkeleton>
            <Skeleton className="h-9 w-40 mb-3" />
            <Skeleton className="h-4 w-64 mb-6" />
            <Skeleton className="h-12 w-full mb-10" rounded="rounded-lg" />
            <HeadingSkeleton />
            <div className="mb-10"><TileGridSkeleton count={4} cols="grid-cols-2 md:grid-cols-4" /></div>
            <HeadingSkeleton />
            <ReviewListSkeleton count={3} />
        </PageSkeleton>
    );
}
