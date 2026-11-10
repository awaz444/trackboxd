import {
    PageSkeleton,
    DetailHeaderSkeleton,
    HeadingSkeleton,
    RowListSkeleton,
} from "@/components/ui/skeleton";

export default function AlbumLoading() {
    return (
        <PageSkeleton width="max-w-5xl">
            <DetailHeaderSkeleton />
            <HeadingSkeleton />
            <RowListSkeleton count={8} media="none" rank />
        </PageSkeleton>
    );
}
