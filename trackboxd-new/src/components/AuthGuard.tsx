"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AuthModal from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

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
  '/albums',
  '/search',
  '/letterboxd-for-music',
  '/alternatives',
  '/song-annotations',
];

// Routes that must render their content to logged-out visitors and crawlers.
// These are the indexable surfaces — gating them behind the auth modal makes
// them worthless in search results.
const isPublicPath = (pathname: string | null | undefined) =>
  !!pathname && (
    publicRoutes.some(route => pathname === route) ||
    pathname.startsWith('/profile/') ||
    pathname.startsWith('/reviews/') ||
    pathname.startsWith('/annotations/') ||
    pathname.startsWith('/songs/') ||
    pathname.startsWith('/albums/') ||
    pathname.startsWith('/playlists/') ||
    (pathname.startsWith('/journals/') && pathname !== '/journals/new')
  );

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isPublicRoute = isPublicPath(pathname);
  // Last public page seen in this tab, so dismissing the modal on a gated page
  // can send the visitor back to something they are allowed to read.
  const lastPublicPath = useRef<string | null>(null);

  useEffect(() => {
    if (isPublicRoute && pathname) lastPublicPath.current = pathname;
  }, [isPublicRoute, pathname]);

  // Signed-out visitors reach gated pages (/home, /albums, /search, ...) from
  // the header nav. Closing the modal there used to do nothing, so people
  // rage-clicked the X. Now it closes and leaves the gated page.
  const leaveGatedPage = () => {
    setShowAuthModal(false);
    let target = lastPublicPath.current;
    if (!target && typeof document !== 'undefined' && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin && isPublicPath(ref.pathname)) {
          target = ref.pathname + ref.search;
        }
      } catch {
        // ignore malformed referrer
      }
    }
    router.push(target || '/');
  };

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
                if (isPublicRoute) {
                  setShowAuthModal(false);
                  return;
                }
                leaveGatedPage();
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
