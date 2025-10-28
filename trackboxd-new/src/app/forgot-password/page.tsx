"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with forgot-password modal
    router.push('/?auth=forgot-password');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F3E7] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#5C5537]">Redirecting to password reset...</p>
      </div>
    </div>
  );
}