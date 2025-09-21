"use client";

import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, Image, Music } from 'lucide-react';
import { signIn } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";
import { findUserByNameOrEmail } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  imageUrl: string;
  spotifyUrl: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  general?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    imageUrl: '',
    spotifyUrl: '',
  });

  const supabase = createClient();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      // Name validation (used as username)
      if (!formData.name) {
        newErrors.name = 'Username is required';
      } else if (formData.name.length < 3) {
        newErrors.name = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
        newErrors.name = 'Username can only contain letters, numbers, and underscores';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Optional field validation
      if (formData.imageUrl && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(formData.imageUrl)) {
        newErrors.imageUrl = 'Please enter a valid image URL';
      }

      if (formData.spotifyUrl && !/^https:\/\/open\.spotify\.com\/user\/.+$/.test(formData.spotifyUrl)) {
        newErrors.spotifyUrl = 'Please enter a valid Spotify profile URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            image_url: formData.imageUrl || null,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: 'An account with this email already exists' });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      if (data.user) {
        // The trigger should automatically create the user in public.users table
        // But let's also manually insert to ensure it works
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            image_url: formData.imageUrl || null,
            spotify_url: formData.spotifyUrl || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          // Don't fail the signup if the insert fails, the trigger might have already created it
        }

        // Sign in the user
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          onClose();
          // Reset form
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            imageUrl: '',
            spotifyUrl: '',
          });
          // Redirect to activity page
          router.push('/activity');
        } else {
          setErrors({ general: 'Account created successfully! Please sign in.' });
          setMode('login');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setErrors({ general: 'Please fill in all required fields' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Check if the input is a name or email and get the corresponding email
      const email = await findUserByNameOrEmail(formData.email);
      
      if (!email) {
        setErrors({ general: 'Invalid username/email or password' });
        return;
      }

      const result = await signIn('credentials', {
        email: email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: 'Invalid username/email or password' });
      } else if (result?.ok) {
        onClose();
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          imageUrl: '',
          spotifyUrl: '',
        });
        // Redirect to activity page
        router.push('/activity');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      imageUrl: '',
      spotifyUrl: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#5C5537]/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-[#FFFBEb] rounded-lg p-8 w-full max-w-md border border-[#5C5537]/20 shadow-lg relative z-10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-[#5C5537]/50 hover:text-[#5C5537] transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        
        {/* Modal Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#5C5537]">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[#5C5537]/70 mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Join the Trackboxd community'}
          </p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {/* Email/Username Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#5C5537] mb-2">
              {mode === 'login' ? 'Email or Username *' : 'Email Address *'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
              <input
                type={mode === 'login' ? 'text' : 'email'}
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                }`}
                placeholder={mode === 'login' ? 'Enter your email or username' : 'Enter your email'}
                required
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#5C5537] mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                }`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50 hover:text-[#5C5537]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Signup-only fields */}
          {mode === 'signup' && (
            <>
              {/* Username Field (stored as name) */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${
                      errors.name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                    }`}
                    placeholder="Choose a username"
                    required
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50 hover:text-[#5C5537]"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Profile Image URL Field */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Profile Image URL (optional)
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
                  <input
                    type="url"
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${
                      errors.imageUrl 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                    }`}
                    placeholder="https://example.com/your-image.jpg"
                  />
                </div>
                {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl}</p>}
              </div>

              {/* Spotify URL Field */}
              <div>
                <label htmlFor="spotifyUrl" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Spotify Profile URL (optional)
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
                  <input
                    type="url"
                    id="spotifyUrl"
                    value={formData.spotifyUrl}
                    onChange={(e) => handleInputChange('spotifyUrl', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${
                      errors.spotifyUrl 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                    }`}
                    placeholder="https://open.spotify.com/user/your-username"
                  />
                </div>
                {errors.spotifyUrl && <p className="text-red-500 text-xs mt-1">{errors.spotifyUrl}</p>}
              </div>
            </>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5C5537] text-white py-2 px-4 rounded-md hover:bg-[#3E3725] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        {/* Mode Switch */}
        <div className="text-center mt-6 pt-6 border-t border-[#5C5537]/10">
          <p className="text-[#5C5537]/70">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={switchMode}
              className="text-[#5C5537] hover:underline font-medium"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
