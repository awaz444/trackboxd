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
import { Save, X } from "lucide-react";

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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
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
          username: data.user.username || "",
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
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
                <div key={i} className="bg-gray-200 rounded-lg aspect-square"></div>
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
          <h1 className="text-2xl font-bold text-[#0C3B2E] mb-4">Profile Not Found</h1>
          <p className="text-[#A0A0A0]">The profile you're looking for doesn't exist.</p>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  const { user, stats, favoriteTracks, recentActivity, following } = profileData;

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      {/* <Header /> */}

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
          {/* Profile Image */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative">
              <img 
                src={formData.image_url || "/default-avatar.jpg"} 
                alt={formData.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#FFFFF5] shadow-lg"
              />
            </div>
          </div>

          {/* Profile Info with Form Fields */}
          <div className="flex-1 w-full">
            <div className="flex flex-col items-center md:items-start md:flex-row md:justify-between gap-4 mb-6">
              <div className="text-center md:text-left w-full">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0C3B2E] mb-2">
                    Display Name
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
                  <label className="block text-sm font-medium text-[#0C3B2E] mb-2">
                    Username
                  </label>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className="w-full md:w-80"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0C3B2E] mb-2">
                    Country
                  </label>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter your country"
                    className="w-full md:w-80"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0C3B2E] mb-2">
                    Profile Image URL
                  </label>
                  <Input
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Enter image URL"
                    className="w-full md:w-80"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0C3B2E] mb-2">
                    Spotify Profile URL
                  </label>
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
                  className="bg-[#5C5537] hover:bg-[#5C5537] text-[#FFFBEb]"
                >
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
                  className="border-[#5C5537] bg-[#FFFBEb] text-[#5C5537] hover:bg-[#F2F3EF]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>

            {/* Stats Grid - Read Only */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 text-center">
                <div className="flex justify-center mb-2 text-[#6D9773]">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="text-2xl font-bold text-[#0C3B2E]">{stats.followers}</div>
                <div className="text-sm text-[#A0A0A0]">Followers</div>
              </div>
              <div className="p-4 text-center">
                <div className="flex justify-center mb-2 text-[#6D9773]">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="text-2xl font-bold text-[#0C3B2E]">{stats.following}</div>
                <div className="text-sm text-[#A0A0A0]">Following</div>
              </div>
              <div className="p-4 text-center">
                <div className="flex justify-center mb-2 text-[#6D9773]">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="text-2xl font-bold text-[#0C3B2E]">{stats.reviews}</div>
                <div className="text-sm text-[#A0A0A0]">Reviews</div>
              </div>
              <div className="p-4 text-center">
                <div className="flex justify-center mb-2 text-[#6D9773]">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="text-2xl font-bold text-[#0C3B2E]">{stats.annotations}</div>
                <div className="text-sm text-[#A0A0A0]">Annotations</div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Favorite Songs - Read Only */}
        <FavoriteTracks
          tracks={favoriteTracks}
          isOwnProfile={true}
        />

        {/* Following Section - Read Only */}
        <FollowingSection
          following={following}
          isOwnProfile={true}
        />
      </div>
      
      <Footer variant="light" />
    </div>
  );
}
