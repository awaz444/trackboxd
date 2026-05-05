// MyReviewsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import EditableReviewCard from "@/components/songs/EditableReviewCard";
import { Review } from "@/app/songs/types";

const MyReviewsPage = () => {
  const { user, loading: userLoading, error: userError } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !userLoading) {
      fetchUserReviews();
    }
  }, [user, userLoading]);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews/my/${user.id}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching user reviews:", err);
      setError("Failed to load your reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (updatedReview: Review) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === updatedReview.id ? updatedReview : review
      )
    );
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      
      const response = await fetch(`/api/reviews/actions/${reviewId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete review");
      }
    } catch (error) {
      console.error("Delete operation failed:", error);
      fetchUserReviews();
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">

        <div className="max-w-5xl mx-auto px-4 py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">

        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-lg mb-4 text-[#5C5537]">You need to be logged in to view your reviews</p>
          <a 
            href="/login" 
            className="bg-[#5C5537] text-white px-4 py-2 rounded-full hover:bg-[#3E3725]"
          >
            Log in
          </a>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBEb]">

      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#5C5537] mb-2">My Reviews</h1>
        <p className="text-[#5C5537]/70 mb-8">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchUserReviews}
              className="mt-2 text-[#5C5537] hover:text-[#3E3725]"
            >
              Try again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#5C5537]/70 mb-4">You haven't written any reviews yet</p>
            <a 
              href="/songs" 
              className="bg-[#5C5537] text-white px-4 py-2 rounded-full hover:bg-[#3E3725]"
            >
              Browse songs to review
            </a>
          </div>
        ) : (
          <div>
            {reviews.map(review => (
              <EditableReviewCard
                key={review.id}
                review={review}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer variant="light" />
    </div>
  );
};

export default MyReviewsPage;