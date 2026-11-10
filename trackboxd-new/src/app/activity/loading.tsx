import {
    PageSkeleton,
    HeadingSkeleton,
    ReviewListSkeleton,
} from "@/components/ui/skeleton";

export default function ActivityLoading() {
    return (
        <PageSkeleton>
            <HeadingSkeleton className="h-9 w-40 mb-6" />
            <ReviewListSkeleton count={5} />
        </PageSkeleton>
    );
}
