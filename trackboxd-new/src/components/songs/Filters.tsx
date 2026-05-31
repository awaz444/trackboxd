import React from "react";
import { Search, Star } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FiltersProps {
    selectedGenre: string;
    setSelectedGenre: (genre: string) => void;
    selectedMood: string;
    setSelectedMood: (mood: string) => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    selectedRating: string;
    setSelectedRating: (rating: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isSearching: boolean;
    searchError: string | null;
    searchSpotify: (query: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
    selectedGenre,
    setSelectedGenre,
    selectedMood,
    setSelectedMood,
    selectedYear,
    setSelectedYear,
    selectedRating,
    setSelectedRating,
    searchTerm,
    setSearchTerm,
    isSearching,
    searchError,
    searchSpotify,
}) => {
    const genres = [
        "All",
        "Pop",
        "Rock",
        "Hip Hop",
        "Alternative",
        "Electronic",
    ];
    const moods = [
        "All",
        "Happy",
        "Sad",
        "Energetic",
        "Chill",
        "Angry",
        "Romantic",
        "Epic",
    ];
    const years = [
        "All",
        "2023",
        "2022",
        "2021",
        "2020",
        "2019",
        "2018",
        "2017",
        "2016",
        "2015",
    ];

    return (
        <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                {/* Filters - Left-aligned */}
                <div className="flex flex-wrap gap-3 flex-1">
                    <div>
                        <h1 className="text-3xl font-bold text-[#5C5537]">
                            Tracks
                        </h1>
                        <p className="text-[#5C5537]/70 mt-2">
                            Discover global tracks and artists, explore genres, moods, and more.
                        </p>
                    </div>
                </div>

                {/* Search - Right-aligned */}
                <div className="w-full lg:w-[320px]">
                    <div className="relative h-full/2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/70 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search tracks, artists, albums..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                searchSpotify(e.target.value);
                            }}
                            className="w-full h-full pl-10 pr-4 py-3 bg-[#FFFBEb] border border-[#5C5537]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5537]/30"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5C5537]"></div>
                            </div>
                        )}
                    </div>
                    {searchError && (
                        <p className="text-[#5C5537] text-sm mt-1">
                            {searchError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Filters;