import {
    PageSkeleton,
    DetailHeaderSkeleton,
    HeadingSkeleton,
    RowListSkeleton,
} from "@/components/ui/skeleton";

export default function PlaylistLoading() {
    return (
        <PageSkeleton width="max-w-5xl">
            <DetailHeaderSkeleton />
            <HeadingSkeleton />
            <RowListSkeleton count={8} size="w-12 h-12" rank />
        </PageSkeleton>
    );
}
