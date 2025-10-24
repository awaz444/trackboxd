"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Search,
    ChevronDown,
    Music,
    Heart,
    Users,
    User,
    Settings,
    LogOut,
    BookOpen,
    MessageSquare,
    FileText,
    Menu,
    X,
    Plus,
    Disc,
    Disc3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import LogModal from "./log/LogModal";
import AuthModal from "./AuthModal";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
    user?: {
        name: string;
        avatar?: string;
        username: string;
    };
}

interface SpotifyUser {
    name: string;
    email: string;
    image_url?: string;
    id: string;
}

interface SearchResult {
    id: string;
    name: string;
    artists?: { name: string }[];
    album?: { name: string; images: { url: string }[] };
    images?: { url: string }[];
    owner?: { display_name: string };
    type: "track" | "album" | "playlist";
}

interface SearchResults {
    tracks: SearchResult[];
    albums: SearchResult[];
    playlists: SearchResult[];
}

const Header: React.FC<HeaderProps> = ({}) => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const pathname = usePathname();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

    // Debounced search effect
    useEffect(() => {
        const delayedSearch = setTimeout(async () => {
            if (searchQuery.trim() && session) {
                setIsSearching(true);
                try {
                    const response = await fetch(
                        `/api/spotify/search?q=${encodeURIComponent(
                            searchQuery
                        )}&type=track,album,playlist&limit=5`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data);
                    }
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [searchQuery]);

    // Click outside to close search results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node) &&
                mobileSearchContainerRef.current &&
                !mobileSearchContainerRef.current.contains(event.target as Node)
            ) {
                setShowResults(false);
                setIsSearchExpanded(false);
                setIsMobileSearchExpanded(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Handle search result click
    const handleResultClick = (type: string, id: string) => {
        let route = "";
        switch (type) {
            case "track":
                route = `/track/${id}`;
                break;
            case "album":
                route = `/album/${id}`;
                break;
            case "playlist":
                route = `/playlist/${id}`;
                break;
            default:
                return;
        }
        router.push(route);
        setShowResults(false);
        setSearchQuery("");
        setIsSearchExpanded(false);
        setIsMobileSearchExpanded(false);
    };

    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowResults(false);
            setSearchQuery("");
            setIsSearchExpanded(false);
            setIsMobileSearchExpanded(false);
        }
    };

    useEffect(() => {
        const fetchSpotifyUser = async () => {
            if (session) {
                try {
                    const response = await fetch("/api/spotify/user");
                    if (response.ok) {
                        const userData = await response.json();
                        setSpotifyUser(userData);
                    }
                } catch (error) {
                    console.error("Error fetching Spotify user:", error);
                }
            }
        };

        fetchSpotifyUser();
    }, [session]); // Re-run when session changes

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const user = {
        name: spotifyUser?.name || "Guest User",
        avatar: spotifyUser?.image_url,
        username: spotifyUser?.email?.split("@")[0] || "guest",
    };

    useEffect(() => {
        if (isSearchExpanded || isMobileSearchExpanded) {
            searchRef.current?.focus();
        }
    }, [isSearchExpanded, isMobileSearchExpanded]);

    const toggleSearch = () => {
        setIsSearchExpanded(!isSearchExpanded);
    };

    const toggleMobileSearch = () => {
        setIsMobileSearchExpanded(!isMobileSearchExpanded);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isDropdownOpen &&
                !(event.target as Element).closest(".dropdown-container")
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await signOut({
                callbackUrl: "/",
                redirect: true,
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const navItems = [
        { label: "Activity", href: "/activity", active: false },
        { label: "Songs", href: "/songs", active: false },
        { label: "Playlists", href: "/playlists", active: false },
        { label: "Albums", href: "/albums", active: false },
    ];

    const dropdownItems = [
        { label: "Profile", href: `/profile/${user.name}`, icon: User, link: true },
        { type: "divider" },
        {
            label: "My Reviews",
            href: "/my-reviews",
            icon: MessageSquare,
            link: true,
        },
        {
            label: "My Annotations",
            href: "/my-annotations",
            icon: FileText,
            link: true,
        },
        { type: "divider" },
        { label: "Logout", onClick: handleLogout, icon: LogOut },
    ];

    const SearchResultItem = ({ item }: { item: SearchResult }) => {
        const imageUrl =
            item.type === "track"
                ? item.album?.images?.[0]?.url
                : item.images?.[0]?.url;

        return (
            <div
                onClick={() => handleResultClick(item.type, item.id)}
                className="flex items-center gap-3 p-3 hover:bg-[#5C5537]/5 cursor-pointer transition-colors duration-200">
                <div className="w-10 h-10 rounded bg-[#5C5537]/10 flex items-center justify-center flex-shrink-0">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full rounded object-cover"
                        />
                    ) : (
                        <Music className="w-5 h-5 text-[#5C5537]/50" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#5C5537] truncate">
                        {item.name}
                    </div>
                    <div className="text-sm text-[#5C5537]/70 truncate">
                        {item.type === "track" && item.artists
                            ? item.artists.map((artist) => artist.name).join(", ")
                            : item.type === "playlist" && item.owner
                            ? `by ${item.owner.display_name}`
                            : item.type}
                    </div>
                </div>
            </div>
        );
    };

    const ClearSearchButton = ({ onClick }: { onClick: () => void }) => (
        <button
            onClick={onClick}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-[#5C5537]/10">
            <X className="w-4 h-4 text-[#5C5537]" />
        </button>
    );

    return (
        <header className="bg-[#FFFBEb] border-b border-[#5C5537]/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left - Logo and Title */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-auto">
                                <Image
                                    src="/logo.svg"
                                    alt="Trackboxd Logo"
                                    width={40}
                                    height={60}
                                    className="h-full w-auto"
                                />
                            </div>
                            <h1 className="hidden md:block text-2xl font-bold text-[#5C5537] tracking-tight mt-1">
                                Trackboxd
                            </h1>
                        </div>
                    </div>

                    {/* Middle - Navigation (desktop) */}
                    {session && (
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        item.active
                                            ? "bg-[#5C5537] text-[#FFFBEb]"
                                            : "text-[#5C5537] hover:bg-[#5C5537]/10"
                                    }`}>
                                    {item.label}
                                </a>
                            ))}
                            <div className="relative ml-2">
                                <div className="relative" ref={searchContainerRef}>
                                    <div
                                        className={`flex items-center transition-all duration-300 ${
                                            isSearchExpanded ? "w-48" : "w-10"
                                        }`}>
                                        {isSearchExpanded ? (
                                            <div className="w-full">
                                                <Input
                                                    type="text"
                                                    placeholder="Search tracks, albums, playlists..."
                                                    value={searchQuery}
                                                    onChange={(e) =>
                                                        setSearchQuery(
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyDown={handleEnter}
                                                    className="w-full border border-[#5C5537]/30 text-[#5C5537] rounded-lg pl-3 pr-8 py-2 h-10 bg-[#FFFBEb] focus:outline-none"
                                                    onFocus={() =>
                                                        setShowResults(true)
                                                    }
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={toggleSearch}
                                                className="p-2 rounded-lg text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200">
                                                <Search className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {isSearchExpanded && (
                                        <ClearSearchButton
                                            onClick={() => {
                                                setSearchQuery("");
                                                setIsSearchExpanded(false);
                                            }}
                                        />
                                    )}

                                    {/* Search Results */}
                                    {showResults &&
                                        (isSearching || searchQuery) && (
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg shadow-lg z-50 max-h-[700px] overflow-y-auto min-w-[400px] max-w-[600px]">
                                                {isSearching ? (
                                                    <div className="p-4 text-center text-[#5C5537]/70">
                                                        Searching...
                                                    </div>
                                                ) : searchResults ? (
                                                    <div className="py-2">
                                                        {searchResults.tracks?.filter(
                                                            Boolean
                                                        ).length > 0 && (
                                                            <>
                                                                <div className="px-4 py-2 text-xs font-semibold text-[#5C5537]/70 uppercase tracking-wider">
                                                                    Tracks
                                                                </div>
                                                                <div className="mb-2">
                                                                    {searchResults.tracks
                                                                        .filter(
                                                                            Boolean
                                                                        )
                                                                        .map((track: any) => (
                                                                                <SearchResultItem
                                                                                    key={`track-${track.id}`}
                                                                                    item={
                                                                                        track
                                                                                    }
                                                                                />
                                                                            ))}
                                                                </div>
                                                            </>
                                                        )}

                                                        {searchResults.albums?.filter(
                                                            Boolean
                                                        ).length > 0 && (
                                                            <>
                                                                <div className="px-4 py-2 text-xs font-semibold text-[#5C5537]/70 uppercase tracking-wider">
                                                                    Albums
                                                                </div>
                                                                <div className="mb-2">
                                                                    {searchResults.albums
                                                                        .filter(
                                                                            Boolean
                                                                        )
                                                                        .map((album: any) => (
                                                                                <SearchResultItem
                                                                                    key={`album-${album.id}`}
                                                                                    item={
                                                                                        album
                                                                                    }
                                                                                />
                                                                            ))}
                                                                </div>
                                                            </>
                                                        )}

                                                        {searchResults.playlists?.filter(
                                                            Boolean
                                                        ).length > 0 && (
                                                            <>
                                                                <div className="px-4 py-2 text-xs font-semibold text-[#5C5537]/70 uppercase tracking-wider">
                                                                    Playlists
                                                                </div>
                                                                <div className="mb-2">
                                                                    {searchResults.playlists
                                                                        .filter(
                                                                            Boolean
                                                                        )
                                                                        .map((playlist: any) => (
                                                                                <SearchResultItem
                                                                                    key={`playlist-${playlist.id}`}
                                                                                    item={
                                                                                        playlist
                                                                                    }
                                                                                />
                                                                            ))}
                                                                </div>
                                                            </>
                                                        )}

                                                        {searchResults.tracks.filter(
                                                            Boolean
                                                        ).length === 0 &&
                                                            searchResults.albums.filter(
                                                                Boolean
                                                            ).length ===
                                                                0 &&
                                                            searchResults.playlists.filter(
                                                                Boolean
                                                            ).length ===
                                                                0 && (
                                                                <div className="px-4 py-8 text-center text-[#5C5537]/70">
                                                                    No
                                                                    results
                                                                    found
                                                                </div>
                                                            )}
                                                    </div>
                                                ) : searchQuery ? (
                                                    <div className="px-4 py-8 text-center text-[#5C5537]/70">
                                                        No results found
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </nav>
                    )}

                    {/* Right - Actions Section (desktop) */}
                    <div className="flex items-center gap-4">
                        {session && (
                            <button
                                onClick={() => setIsLogModalOpen(true)}
                                className="hidden md:flex items-center gap-1.5 bg-[#5C5537] text-[#FFFBEb] py-2 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:bg-[#5C5537]/90 shadow-sm">
                                <Plus className="w-4 h-4" />
                                <span className="font-medium text-sm">Log</span>
                            </button>
                        )}

                        {/* User Section */}
                        <div className="hidden md:block relative">
                            {session ? (
                                <div className="dropdown-container">
                                    <button
                                        onClick={toggleDropdown}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#5C5537]/10 transition-colors duration-200">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-[#5C5537] flex items-center justify-center ring-2 ring-[#5C5537]">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-[#FFFBEb] text-sm font-semibold">
                                                        {getInitials(
                                                            spotifyUser?.name ||
                                                                "Guest User"
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-[#5C5537]">
                                                {spotifyUser?.name || "Guest User"}
                                            </div>
                                            <div className="text-xs text-[#5C5537]/70">
                                                {spotifyUser?.email || "guest@example.com"}
                                            </div>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-[#5C5537]/70" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg shadow-lg z-50">
                                            <div className="py-2">
                                                {dropdownItems.map((item, index) =>
                                                    item.type === "divider" ? (
                                                        <div
                                                            key={index}
                                                            className="h-px bg-[#5C5537]/20 my-2"
                                                        />
                                                    ) : item.link ? (
                                                        <Link
                                                            key={item.label}
                                                            href={item.href || "#"}
                                                            className="flex items-center gap-3 px-4 py-3 text-sm text-left text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200"
                                                            onClick={() =>
                                                                setIsDropdownOpen(false)
                                                            }>
                                                            {item.icon && (
                                                                <item.icon className="w-4 h-4 text-[#5C5537]/70" />
                                                            )}
                                                            {item.label}
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            key={item.label}
                                                            onClick={item.onClick}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200 ${
                                                                item.onClick ? "cursor-pointer" : ""
                                                            }`}>
                                                            {item.icon && (
                                                                <item.icon className="w-4 h-4 text-[#5C5537]/70" />
                                                            )}
                                                            {item.label}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200 rounded-lg">
                                    Log In
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 rounded-lg text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200">
                            {isMobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    {session && (
                        <>
                            {/* Mobile Search */}
                            <div className="px-4 py-3 border-b border-[#5C5537]/20">
                                <div className="relative" ref={mobileSearchContainerRef}>
                                    {isMobileSearchExpanded ? (
                                        <div className="w-full">
                                            <Input
                                                type="text"
                                                placeholder="Search tracks, albums, playlists..."
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(e.target.value)
                                                }
                                                onKeyDown={handleEnter}
                                                className="w-full border border-[#5C5537]/30 text-[#5C5537] rounded-lg pl-3 pr-8 py-2 h-10 bg-[#FFFBEb] focus:outline-none"
                                                onFocus={() => setShowResults(true)}
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={toggleMobileSearch}
                                            className="p-2 rounded-lg text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200">
                                            <Search className="w-5 h-5" />
                                        </button>
                                    )}

                                    {isMobileSearchExpanded && (
                                        <ClearSearchButton
                                            onClick={() => {
                                                setSearchQuery("");
                                                setIsMobileSearchExpanded(false);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Mobile Navigation */}
                            <div className="px-4 py-3">
                                <nav className="flex flex-col gap-1">
                                    {navItems.map((item) => (
                                        <a
                                            key={item.label}
                                            href={item.href}
                                            className={`px-3 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                                                item.active
                                                    ? "bg-[#5C5537] text-[#FFFBEb]"
                                                    : "text-[#5C5537] hover:bg-[#5C5537]/10"
                                            }`}>
                                            {item.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>

                            {/* Mobile Log Button */}
                            <div className="px-4 py-3 border-t border-[#5C5537]/20">
                                <button
                                    onClick={() => setIsLogModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-1.5 bg-[#5C5537] text-[#FFFBEb] py-3 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:bg-[#5C5537]/90 shadow-sm">
                                    <Plus className="w-4 h-4" />
                                    <span className="font-medium text-base">Log</span>
                                </button>
                            </div>
                        </>
                    )}

                    {/* Mobile User Section */}
                    <div className="border-t border-[#5C5537]/20 px-4 py-3">
                        {session ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-[#5C5537] flex items-center justify-center ring-2 ring-[#5C5537]">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={spotifyUser?.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[#FFFBEb] text-base font-semibold">
                                                    {getInitials(
                                                        spotifyUser?.name ||
                                                            "Guest User"
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-[#5C5537]">
                                            {spotifyUser?.name || "Guest User"}
                                        </div>
                                        <div className="text-sm text-[#5C5537]/70">
                                            {spotifyUser?.email || "guest@example.com"}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Dropdown Items */}
                                <div className="flex flex-col gap-1">
                                    {dropdownItems.map((item, index) =>
                                        item.type === "divider" ? (
                                            <div
                                                key={index}
                                                className="h-px bg-[#5C5537]/20 my-2"
                                            />
                                        ) : item.link ? (
                                            <Link
                                                key={item.label}
                                                href={item.href || "#"}
                                                className="flex items-center gap-3 px-3 py-3 text-base text-left text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200 rounded-lg"
                                                onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                }>
                                                {item.icon && (
                                                    <item.icon className="w-5 h-5 text-[#5C5537]/70" />
                                                )}
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <button
                                                key={item.label}
                                                onClick={item.onClick}
                                                className={`flex items-center gap-3 px-3 py-3 text-base text-left text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200 rounded-lg ${
                                                    item.onClick ? "cursor-pointer" : ""
                                                }`}>
                                                {item.icon && (
                                                    <item.icon className="w-5 h-5 text-[#5C5537]/70" />
                                                )}
                                                {item.label}
                                            </button>
                                        )
                                    )}
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full text-center py-3 text-base font-medium text-[#5C5537] hover:bg-[#5C5537]/10 transition-colors duration-200 rounded-lg">
                                Log In
                            </button>
                        )}
                    </div>
                </div>
            )}
            <LogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                defaultMode="login"
            />
        </header>
    );
};

export default Header;