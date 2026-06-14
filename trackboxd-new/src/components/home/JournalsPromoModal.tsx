"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, BookOpen, ArrowRight } from "lucide-react";

interface JournalsPromoModalProps {
    onClose: () => void;
}

const JournalsPromoModal: React.FC<JournalsPromoModalProps> = ({ onClose }) => {
    const router = useRouter();

    const handleCreate = () => {
        onClose();
        router.push("/journals/new");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#5C5537]/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-[#FFFBEb] rounded-xl p-6 w-full max-w-sm border border-[#5C5537]/20 shadow-lg relative z-10 text-center">
                <button
                    className="absolute top-4 right-4 text-[#5C5537]/50 hover:text-[#5C5537] transition-colors"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>

                <div className="w-12 h-12 rounded-full bg-[#5C5537]/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-[#5C5537]" />
                </div>

                <h2 className="text-lg font-bold text-[#5C5537]">Introducing Journals</h2>
                <p className="text-sm text-[#5C5537]/70 mt-2 leading-relaxed">
                    Curate a set of tracks, write reviews for each one, and share the
                    whole story with friends, or import a Spotify playlist to get started.
                </p>

                <div className="flex flex-col gap-2 mt-6">
                    <button
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-1.5 text-sm font-medium bg-[#5C5537] text-white py-2.5 rounded-lg hover:bg-[#3E3725] transition-colors"
                    >
                        Create a journal
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="text-sm text-[#5C5537]/60 hover:text-[#5C5537] py-1 transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JournalsPromoModal;
