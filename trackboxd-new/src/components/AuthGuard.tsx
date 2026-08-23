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
    '/tracks',
    '/letterboxd-for-music',
    '/alternatives',
    '/song-annotations',
  ];

  // Routes that must render their content to logged-out visitors and crawlers.
  // These are the indexable surfaces — gating them behind the auth modal makes
  // them worthless in search results.
  const isPublicRoute =
    publicRoutes.some(route => pathname === route) ||
    pathname?.startsWith('/profile/') ||
    pathname?.startsWith('/reviews/') ||
    pathname?.startsWith('/annotations/') ||
    pathname?.startsWith('/songs/') ||
    pathname?.startsWith('/albums/') ||
    pathname?.startsWith('/playlists/') ||
    (pathname?.startsWith('/journals/') && pathname !== '/journals/new');

  useEffect(() => {
    if (isPublicRoute) {
      setShowAuthModal(false);
      return;
    }
    if (loading) return;
    setShowAuthModal(!user);
  }, [user, loading, pathname, isPublicRoute]);

  // NOTE: children are always rendered, including during the initial auth check.
  // `loading` starts as `true` and is only resolved in a client-side effect, so
  // returning a loading gate here blanks the server-rendered HTML for every
  // route — crawlers that do not execute JS then see an empty page.
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
