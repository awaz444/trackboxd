import {
    PageSkeleton,
    Skeleton,
    TextSkeleton,
    RowSkeleton,
} from "@/components/ui/skeleton";

export default function ReviewLoading() {
    return (
        <PageSkeleton width="max-w-2xl">
            <div className="flex gap-4 mb-5">
                <Skeleton className="w-20 h-20 shrink-0" rounded="rounded-xl" />
                <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <TextSkeleton lines={3} className="mb-5" />
            <RowSkeleton media="round" size="w-8 h-8" />
        </PageSkeleton>
    );
}
