// LogModal.tsx
"use client";

import React, { useState } from "react";
import { X, Music, MessageSquare, BookOpen } from "lucide-react";
import LogFormTabs from "./LogFormTabs";

interface LogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-[#5C5537]/20"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div
                    className="relative bg-[#FFFBEb] rounded-lg shadow-lg w-full max-w-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="bg-[#5C5537] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-[#FFFBEb]" />
                            <h2 className="text-xl text-[#FFFBEb]">
                                Create New Log
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-[#3E3725] transition-colors">
                            <X className="w-6 h-6 text-[#FFFBEb]" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6">
                        <LogFormTabs onClose={onClose} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogModal;