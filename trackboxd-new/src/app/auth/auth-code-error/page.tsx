"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from "next/link";

// Isolated so `useSearchParams` does not opt the whole page out of prerendering.
const AuthErrorMessage: React.FC = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <>{error ? `Error: ${decodeURIComponent(error)}` : 'The authentication link you clicked is invalid or has expired.'}</>
  );
};

const AuthCodeErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFBEb] flex items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        {/* Back Button */}
        <div className="mb-6 text-left">
          <Link
            href="/"
            className="inline-flex items-center text-[#6B6547] hover:text-[#5C5537] transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Error Icon */}
        <div className="mb-6">
          <AlertCircle className="mx-auto text-[#6B6547]" size={64} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#5C5537] mb-2">
            Authentication Error
          </h1>
          <p className="text-[#6B6547]">
            <Suspense fallback="The authentication link you clicked is invalid or has expired.">
              <AuthErrorMessage />
            </Suspense>
          </p>
        </div>

        {/* Error Message */}
        <div className="mb-6 text-[#5C5537]">
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
            className="block w-full bg-[#5C5537]/10 text-[#5C5537] hover:bg-[#5C5537]/15 py-2.5 px-4 rounded-full transition-colors text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthCodeErrorPage;