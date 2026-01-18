// MyAnnotationsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useUser from "@/hooks/useUser";
import EditableAnnotationCard from "@/components/songs/EditableAnnotationCard";
import { Annotation } from "@/app/songs/types";

const MyAnnotationsPage = () => {
  const { user, loading: userLoading, error: userError } = useUser();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !userLoading) {
      fetchUserAnnotations();
    }
  }, [user, userLoading]);

  const fetchUserAnnotations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/annotate/my/${user.id}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch annotations");
      }
      
      const data = await res.json();
      setAnnotations(data);
    } catch (err) {
      console.error("Error fetching user annotations:", err);
      setError("Failed to load your annotations");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnnotation = (updatedAnnotation: Annotation) => {
    setAnnotations(prev => 
      prev.map(annotation => 
        annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
      )
    );
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      
      const response = await fetch(`/api/annotate`, {
        method: "DELETE",
        body: JSON.stringify({ 
          annotationId,
          userId: user.id 
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete annotation");
      }
    } catch (error) {
      console.error("Delete operation failed:", error);
      fetchUserAnnotations();
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBEb]">
        {/* <Header /> */}
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
        {/* <Header /> */}
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-lg mb-4 text-[#5C5537]">You need to be logged in to view your annotations</p>
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
      {/* <Header /> */}
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#5C5537] mb-2">My Annotations</h1>
        <p className="text-[#5C5537]/70 mb-8">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5537]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchUserAnnotations}
              className="mt-2 text-[#5C5537] hover:text-[#3E3725]"
            >
              Try again
            </button>
          </div>
        ) : annotations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#5C5537]/70 mb-4">You haven't created any annotations yet</p>
            <a 
              href="/songs" 
              className="bg-[#5C5537] text-white px-4 py-2 rounded-full hover:bg-[#3E3725]"
            >
              Browse songs to annotate
            </a>
          </div>
        ) : (
          <div>
            {annotations.map(annotation => (
              <EditableAnnotationCard
                key={annotation.id}
                annotation={annotation}
                onEdit={handleEditAnnotation}
                onDelete={handleDeleteAnnotation}
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer variant="light" />
    </div>
  );
};

export default MyAnnotationsPage;