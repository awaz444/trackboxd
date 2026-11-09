'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import AuthGuard from '@/components/AuthGuard';
import { initAnalytics } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  React.useEffect(() => {
    initAnalytics();

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }
  }, []);

  const hideHeader = React.useMemo(() => {
    if (!pathname) return false;
    // Hide on landing and common auth routes
    return pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register');
  }, [pathname]);

  return (
    <AuthGuard>
      {!hideHeader && <Header />}
      {/* Leave room for the phone bottom tab bar (rendered by Header when signed in). */}
      <div className={!hideHeader && user ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : undefined}>
        {children}
      </div>
    </AuthGuard>
  );
}



