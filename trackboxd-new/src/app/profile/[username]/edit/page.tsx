"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import FavoriteTracks from "@/components/profile/FavoriteTracks";
import FollowingSection from "@/components/profile/FollowingSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Save, X, Upload, HelpCircle } from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { COUNTRIES } from "./countries";

interface ProfilePageProps {
    params: {
        username: string;
    };
}

interface ProfileData {
    user: {
        id: string;
        name: string;
        username: string;
        image_url?: string;
        country?: string;
        spotify_url?: string;
        created_at: string;
    };
    stats: {
        followers: number;
        following: number;
        reviews: number;
        annotations: number;
    };
    favoriteTracks: Array<{
        id: string;
        name: string;
        artist: string;
        cover_url?: string;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        track: {
            id: string;
            title: string;
            artist: string;
            cover_url?: string;
        };
        timestamp: string;
    }>;
    following: Array<{
        id: string;
        username: string;
        name: string;
        image_url?: string;
    }>;
}

export default function EditProfilePage({ params }: ProfilePageProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSpotifyHelp, setShowSpotifyHelp] = useState(false);

    // Form state - removed username field
    const [formData, setFormData] = useState({
        name: "",
        country: "",
        image_url: "",
        spotify_url: "",
    });

    // Check if user is authorized to edit this profile
    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user?.id) {
            router.push("/");
            return;
        }

        // Fetch profile data
        const fetchProfileData = async () => {
            try {
                const response = await fetch(`/api/profile/${params.username}`);
                if (!response.ok) {
                    throw new Error("Profile not found");
                }
                const data = await response.json();

                // Check if the logged-in user matches the profile owner
                if (data.user.id !== session.user.id) {
                    router.push(`/profile/${params.username}`);
                    return;
                }

                setProfileData(data);
                setFormData({
                    name: data.user.name || "",
                    country: data.user.country || "",
                    image_url: data.user.image_url || "",
                    spotify_url: data.user.spotify_url || "",
                });
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
                setError("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [session, status, params.username, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCountryChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            country: value,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/profile/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            setSuccess("Profile updated successfully!");

            // Update the profile data
            if (profileData) {
                setProfileData({
                    ...profileData,
                    user: {
                        ...profileData.user,
                        ...formData,
                    },
                });
            }

            // Redirect to the updated profile
            setTimeout(() => {
                router.push(`/profile/${formData.name}`);
            }, 1500);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update profile"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const supabase = createSupabaseClient();

            // Generate unique filename
            const fileExt = file.name.split(".").pop();
            const fileName = `${session?.user?.id}-${Date.now()}.${fileExt}`;

            console.log("Attempting upload to avatars bucket...");

            // Direct upload without bucket check
            const { data, error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type,
                });

            if (uploadError) {
                console.error("Upload error details:", uploadError);

                // More specific error handling
                if (uploadError.message?.includes("not found")) {
                    throw new Error(
                        "Storage bucket not found. Please check bucket configuration."
                    );
                } else if (uploadError.message?.includes("policy")) {
                    throw new Error(
                        "Upload permission denied. Please check RLS policies."
                    );
                } else if (uploadError.message?.includes("size")) {
                    throw new Error("File too large. Maximum size is 5MB.");
                } else {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }
            }

            console.log("Upload successful:", data);

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            console.log("Public URL:", urlData);

            setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
            setSuccess("Profile image updated successfully!");
        } catch (err) {
            console.error("Image upload failed:", err);
            setError(
                err instanceof Error ? err.message : "Failed to upload image"
            );
        }
    };

    const handleCancel = () => {
        router.push(`/profile/${params.username}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFFF0]">
                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <div className="animate-pulse">
                        <div className="rounded-full bg-gray-200 h-32 w-32 mx-auto mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
                        <div className="grid grid-cols-4 gap-4 mt-8">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-200 rounded-lg aspect-square"></div>
                            ))}
                        </div>
                    </div>
                </div>
                <Footer variant="light" />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-[#FFFFF0]">
                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <h1 className="text-2xl font-bold text-[#0C3B2E] mb-4">
                        Profile Not Found
                    </h1>
                    <p className="text-[#A0A0A0]">
                        The profile you're looking for doesn't exist.
                    </p>
                </div>
                <Footer variant="light" />
            </div>
        );
    }

    const { user, stats, favoriteTracks, recentActivity, following } =
        profileData;

    return (
        <div className="min-h-screen bg-[#FFFBEb]">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Profile Header with Edit Form */}
                <div className="flex flex-col items-center md:flex-row gap-8 mb-8">
                    {/* Profile Image with Upload Overlay */}
                    <div className="flex-shrink-0 flex justify-center md:justify-start">
                        <div className="relative group">
                            <img
                                src={
                                    formData.image_url || "/default-avatar.jpg"
                                }
                                alt={formData.name}
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#FFFFF5] shadow-lg"
                            />
                            <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-8 h-8 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Profile Info with Form Fields */}
                    <div className="flex-1 w-full">
                        <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4 mb-6">
                            <div className="text-center md:text-left w-full">
                                <div className="mb-4">
                                    <label className="block text-sm text-left font-medium text-[#0C3B2E] mb-2 ml-1">
                                        Username
                                    </label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter your display name"
                                        className="w-full md:w-80"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm text-left font-medium text-[#0C3B2E] mb-2 ml-1">
                                        Country
                                    </label>
                                    <Select
                                        value={formData.country}
                                        onValueChange={handleCountryChange}>
                                        <SelectTrigger className="w-full md:w-80">
                                            <SelectValue placeholder="Select your country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Select a country
                                            </SelectItem>
                                            {COUNTRIES.map((country) => (
                                                <SelectItem
                                                    key={country.code}
                                                    value={country.code}>
                                                    {country.name} (
                                                    {country.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="block text-sm font-medium text-[#0C3B2E] ml-1">
                                            Spotify Profile URL
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSpotifyHelp(
                                                    !showSpotifyHelp
                                                )
                                            }
                                            className="text-gray-400 hover:text-gray-600">
                                            <HelpCircle className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {showSpotifyHelp && (
                                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                                            <p className="font-medium">
                                                How to find your Spotify Profile
                                                URL:
                                            </p>
                                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                                <li>
                                                    Open Spotify app or web
                                                    player
                                                </li>
                                                <li>
                                                    Click on your profile name
                                                    in the top right
                                                </li>
                                                <li>
                                                    Select "Profile" from the
                                                    menu
                                                </li>
                                                <li>
                                                    Copy the URL from your
                                                    browser's address bar
                                                </li>
                                                <li>
                                                    It should look like:{" "}
                                                    <code>
                                                    https://open.spotify.com/user/dqnrpmx4jqtyv0apn90obvriy
                                                    </code>
                                                </li>
                                            </ol>
                                            <p className="mt-2">
                                                This allows other users to visit
                                                your Spotify profile.
                                            </p>
                                        </div>
                                    )}

                                    <Input
                                        name="spotify_url"
                                        value={formData.spotify_url}
                                        onChange={handleInputChange}
                                        placeholder="https://open.spotify.com/user/..."
                                        className="w-full md:w-80"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-[#5C5537] hover:bg-[#5C5537] text-[#FFFBEb]">
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="border-[#5C5537] bg-[#FFFBEb] text-[#5C5537] hover:bg-[#F2F3EF]">
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Favorite Songs - Read Only */}
                <FavoriteTracks tracks={favoriteTracks} isOwnProfile={true} />

                {/* Following Section - Read Only */}
                <FollowingSection following={following} isOwnProfile={true} />
            </div>

            <Footer variant="light" />
        </div>
    );
}
