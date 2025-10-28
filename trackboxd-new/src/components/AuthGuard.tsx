"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Define public routes that don't require authentication
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

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  useEffect(() => {
    // If we're on a public route, don't show auth modal
    if (isPublicRoute) {
      setShowAuthModal(false);
      return;
    }

    // If session is loading, wait
    if (status === 'loading') {
      return;
    }

    // If user is not authenticated and not on a public route, show auth modal
    if (!session && !isPublicRoute) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [session, status, pathname, isPublicRoute]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFFBEb] flex items-center justify-center">
        <div className="text-[#5C5537] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Auth Modal - shown when user is not authenticated on protected routes */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          {/* Modal */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => {
                // Don't allow closing the modal on protected routes
                // User must authenticate to continue
                if (!isPublicRoute) {
                  return;
                }
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