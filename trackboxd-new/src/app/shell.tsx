'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import AuthGuard from '@/components/AuthGuard';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeader = React.useMemo(() => {
    if (!pathname) return false;
    // Hide on landing and common auth routes
    return pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register');
  }, [pathname]);

  return (
    <AuthGuard>
      {!hideHeader && <Header />}
      {children}
    </AuthGuard>
  );
}



