"use client";

import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from "next/link";

const AuthCodeErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex items-center justify-center px-5">
      <div className="bg-white rounded-lg p-8 w-full max-w-md border border-[#5C5537]/20 shadow-lg text-center">
        {/* Back Button */}
        <div className="mb-6 text-left">
          <Link 
            href="/"
            className="inline-flex items-center text-[#5C5537]/70 hover:text-[#5C5537] transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Error Icon */}
        <div className="mb-6">
          <AlertCircle className="mx-auto text-[#5C5537]/70" size={64} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#5C5537] mb-2">
            Authentication Error
          </h1>
          <p className="text-[#5C5537]/70">
            The authentication link you clicked is invalid or has expired.
          </p>
        </div>

        {/* Error Message */}
        <div className="mb-6 p-4 bg-[#5C5537]/10 border border-[#5C5537]/20 text-[#5C5537] rounded-lg">
          <p className="text-sm">
            This could happen if:
          </p>
          <ul className="text-sm mt-2 text-left list-disc list-inside space-y-1">
            <li>The link has expired</li>
            <li>The link has already been used</li>
            <li>The link was copied incorrectly</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="block w-full bg-[#5C5537] text-white py-2 px-4 rounded-md hover:bg-[#3E3725] transition-colors text-center"
          >
            Request New Reset Link
          </Link>
          
          <Link
            href="/"
            className="block w-full border border-[#5C5537]/20 text-[#5C5537] py-2 px-4 rounded-md hover:bg-[#5C5537]/5 transition-colors text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthCodeErrorPage;