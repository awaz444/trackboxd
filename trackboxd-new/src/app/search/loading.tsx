import {
    PageSkeleton,
    HeadingSkeleton,
    Skeleton,
    RowListSkeleton,
    TileGridSkeleton,
} from "@/components/ui/skeleton";

export default function SearchLoading() {
    return (
        <PageSkeleton>
            <Skeleton className="h-10 w-full mb-8" rounded="rounded-lg" />
            <HeadingSkeleton />
            <RowListSkeleton count={4} className="mb-8" />
            <HeadingSkeleton />
            <TileGridSkeleton count={4} cols="grid-cols-2 md:grid-cols-4" />
        </PageSkeleton>
    );
}
