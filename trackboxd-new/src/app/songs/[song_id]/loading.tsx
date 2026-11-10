import {
    PageSkeleton,
    DetailHeaderSkeleton,
    Skeleton,
    HeadingSkeleton,
    ReviewListSkeleton,
} from "@/components/ui/skeleton";

export default function SongLoading() {
    return (
        <PageSkeleton width="max-w-5xl">
            <DetailHeaderSkeleton />
            <div className="grid grid-cols-4 gap-2 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-6 w-10" />
                        <Skeleton className="h-3 w-14" />
                    </div>
                ))}
            </div>
            <HeadingSkeleton />
            <ReviewListSkeleton count={3} cover={false} />
        </PageSkeleton>
    );
}
