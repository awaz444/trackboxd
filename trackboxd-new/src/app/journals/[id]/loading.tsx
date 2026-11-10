import {
    PageSkeleton,
    Skeleton,
    TextSkeleton,
    RowListSkeleton,
} from "@/components/ui/skeleton";

export default function JournalLoading() {
    return (
        <PageSkeleton width="max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-5 mb-8">
                <Skeleton className="w-40 h-40 shrink-0" rounded="rounded-xl" />
                <div className="flex-1 min-w-0">
                    <Skeleton className="h-7 w-2/3 mb-3" />
                    <TextSkeleton lines={2} className="mb-4" />
                    <Skeleton className="h-9 w-28" rounded="rounded-full" />
                </div>
            </div>
            <RowListSkeleton count={6} />
        </PageSkeleton>
    );
}
