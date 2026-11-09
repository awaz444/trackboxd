// LogFormTabs.tsx
"use client";

import React, { useState } from "react";
import { MessageSquare, Music } from "lucide-react";
import ReviewForm from "./forms/ReviewForm";
import AnnotationForm from "./forms/AnnotationForm";

interface LogFormTabsProps {
  onClose: () => void;
}

const LogFormTabs: React.FC<LogFormTabsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"review" | "annotation">("review");

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`flex items-center gap-2 px-4 py-3 font-medium ${
            activeTab === "review"
              ? "text-[#5C5537] border-b-2 border-[#5C5537]"
              : "text-[#6B6547] hover:text-[#5C5537]"
          }`}
          onClick={() => setActiveTab("review")}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Review</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 font-medium ${
            activeTab === "annotation"
              ? "text-[#5C5537] border-b-2 border-[#5C5537]"
              : "text-[#6B6547] hover:text-[#5C5537]"
          }`}
          onClick={() => setActiveTab("annotation")}
        >
          <Music className="w-5 h-5" />
          <span>Annotation</span>
        </button>
      </div>

      {/* Form Content */}
      <div className="min-h-[400px]">
        {activeTab === "review" ? (
          <ReviewForm onClose={onClose} />
        ) : (
          <AnnotationForm onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default LogFormTabs;