"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const publicRoutes = [
    '/',
    '/auth',
    '/login',
    '/register',
    '/about',
    '/contact',
    '/privacy',
    '/forgot-password',
    '/update-password',
    '/auth/auth-code-error',
  ];

  const isPublicRoute =
    publicRoutes.some(route => pathname === route) ||
    pathname?.startsWith('/profile/') ||
    pathname?.startsWith('/reviews/') ||
    pathname?.startsWith('/annotations/') ||
    (pathname?.startsWith('/journals/') && pathname !== '/journals/new');

  useEffect(() => {
    if (isPublicRoute) {
      setShowAuthModal(false);
      return;
    }
    if (loading) return;
    setShowAuthModal(!user);
  }, [user, loading, pathname, isPublicRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBEb] flex items-center justify-center">
        <div className="text-[#5C5537] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {children}

      {showAuthModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => {
                if (!isPublicRoute) return;
                setShowAuthModal(false);
              }}
              defaultMode="login"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AuthGuard;
