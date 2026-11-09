"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Activity, User } from "lucide-react";

interface BottomTabBarProps {
    profileHref: string;
    avatarUrl?: string | null;
    onLog: () => void;
}

/**
 * Phone-only primary navigation. Mirrors the desktop nav (Home, Activity,
 * Tracks/Albums) plus the two things people do most on a phone: log something
 * and jump to their own profile. Hidden from `md` up, where the header nav
 * takes over.
 */
export default function BottomTabBar({ profileHref, avatarUrl, onLog }: BottomTabBarProps) {
    const pathname = usePathname() || "";

    const isExplore = ["/tracks", "/albums", "/playlists", "/search"].some((p) => pathname.startsWith(p));
    const tabs = [
        { label: "Home", href: "/home", icon: Home, active: pathname === "/home" },
        { label: "Explore", href: "/tracks", icon: Compass, active: isExplore },
        { label: "Activity", href: "/activity", icon: Activity, active: pathname.startsWith("/activity") },
        { label: "Profile", href: profileHref, icon: User, active: pathname.startsWith("/profile") || pathname.startsWith("/my-") },
    ];

    const tabClass = (active: boolean) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] text-[11px] ${
            active ? "text-[#5C5537] font-bold" : "text-[#6B6547]"
        }`;

    const renderTab = (tab: (typeof tabs)[number]) => (
        <Link key={tab.label} href={tab.href} className={tabClass(tab.active)} aria-current={tab.active ? "page" : undefined}>
            {tab.label === "Profile" && avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt=""
                    className={`w-6 h-6 rounded-full object-cover ${tab.active ? "ring-2 ring-[#5C5537]" : ""}`}
                />
            ) : (
                <tab.icon className="w-6 h-6" strokeWidth={tab.active ? 2.4 : 1.8} />
            )}
            {tab.label}
        </Link>
    );

    return (
        <nav
            aria-label="Primary"
            className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-[#F6F0DA]/95 backdrop-blur"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex items-stretch px-2 h-16">
                {tabs.slice(0, 2).map(renderTab)}
                <div className="flex flex-1 items-center justify-center">
                    <button
                        type="button"
                        onClick={onLog}
                        aria-label="Log a review or annotation"
                        className="w-12 h-12 rounded-full bg-[#5C5537] text-[#FFFBEb] flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <Plus className="w-6 h-6" strokeWidth={2.4} />
                    </button>
                </div>
                {tabs.slice(2).map(renderTab)}
            </div>
        </nav>
    );
}
