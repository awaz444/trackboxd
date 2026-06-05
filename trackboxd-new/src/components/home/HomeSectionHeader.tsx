import Link from "next/link";

interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  viewMoreHref?: string;
}

export default function HomeSectionHeader({
  title,
  subtitle,
  viewMoreHref,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-2xl font-bold text-[#5C5537]">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[#5C5537]/60 mt-0.5">{subtitle}</p>
        )}
      </div>
      {viewMoreHref && (
        <Link
          href={viewMoreHref}
          className="text-sm font-medium text-[#5C5537]/70 hover:text-[#5C5537] transition-colors shrink-0 ml-4"
        >
          View more →
        </Link>
      )}
    </div>
  );
}
