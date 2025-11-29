"use client";

import React from "react";
import { X } from "lucide-react";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#FFFBEb] rounded-lg w-full max-w-2xl mx-4 z-50 border border-[#5C5537]/20 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#5C5537]/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#5C5537]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#5C5537]/70 hover:text-[#5C5537] hover:bg-[#5C5537]/10 p-1 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ContentModal;
