"use client"

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Music } from 'lucide-react';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import Image from "next/image";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>('login');
  const searchParams = useSearchParams();

  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam && ['login', 'signup', 'forgot-password', 'update-password'].includes(authParam)) {
      setAuthMode(authParam as 'login' | 'signup' | 'forgot-password' | 'update-password');
      setShowAuthModal(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FFFBEb] flex flex-col relative">
      {/* Header with Auth buttons */}
      {/* <div className="absolute top-6 right-6 z-20 flex gap-3">
        <button
          className="text-sm text-[#5C5537]/70 hover:text-[#5C5537] transition-colors"
          onClick={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
        >
          Sign In
        </button>
        <button
          className="text-sm bg-[#5C5537] text-white px-3 py-1 rounded hover:bg-[#3E3725] transition-colors"
          onClick={() => {
            setAuthMode('signup');
            setShowAuthModal(true);
          }}
        >
          Sign Up
        </button>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo Section - Updated to center logo above text */}
        <div className="flex flex-col items-center mb-2">
          <div className="relative w-32 h-32 mb-6">
            <Image
              src="/logo.svg"
              alt="Trackboxd Logo"
              layout="fill"
              objectFit="contain"
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-[#5C5537] mb-4">
            Trackboxd
          </h1>

          <div className="text-center">
            <p className="text-xl text-[#5C5537]/70 mb-10 max-w-md">
              Your music, your words.
            </p>

            <div className="h-px w-48 bg-[#5C5537]/20 mx-auto mb-10"></div>
          </div>
        </div>

        {/* Get Started Button */}
        <div className="animate-fade-in-up mb-12">
          <button
            className="text-lg text-[#5C5537] hover:text-[#3E3725] transition-colors font-medium px-6 py-3 rounded-md hover:bg-[#5C5537]/5"
            onClick={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
          >
            Begin Your Journey →
          </button>
        </div>

        {/* SEO Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 pb-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <article className="text-center space-y-2">
            <h2 className="text-sm font-bold text-[#5C5537] uppercase tracking-wide">Track Reviews</h2>
            <p className="text-xs text-[#5C5537]/70 leading-relaxed">
              Share your thoughts on the latest albums and singles. Expressive ratings, detailed critiques, or just a simple vibe check. Build your music profile with every list.
            </p>
          </article>

          <article className="text-center space-y-2">
            <h2 className="text-sm font-bold text-[#5C5537] uppercase tracking-wide">Deep Annotations</h2>
            <p className="text-xs text-[#5C5537]/70 leading-relaxed">
              Dive into the lyrics. Annotate specific lines, explain hidden meanings, or decode the artist's intent. Connect with the deeper layers of your favorite songs.
            </p>
          </article>

          <article className="text-center space-y-2">
            <h2 className="text-sm font-bold text-[#5C5537] uppercase tracking-wide">Social Discovery</h2>
            <p className="text-xs text-[#5C5537]/70 leading-relaxed">
              Follow friends and tastemakers. See what they're listening to, liking, and reviewing in real-time. Discover your next obsession through your community.
            </p>
          </article>
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;