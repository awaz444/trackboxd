"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with update-password modal
    router.push('/?auth=update-password');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F3E7] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#5C5537]">Redirecting to password update...</p>
      </div>
    </div>
  );
}