"use client";

import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { signIn, useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";
import { findUserByNameOrEmail } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'forgot-password' | 'update-password';
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const supabase = createClient();

  // Update mode when defaultMode prop changes
  useEffect(() => {
    console.log('AuthModal: defaultMode changed to', defaultMode);
    setMode(defaultMode);
  }, [defaultMode]);

  // Check authentication for update-password mode
  useEffect(() => {
    if (mode === 'update-password') {
      const checkAuth = async () => {
        // Add a small delay to ensure the session is properly set after redirect
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: { user } } = await supabase.auth.getUser();
        console.log('Auth check for update-password mode:', { user: !!user, userId: user?.id });

        if (user) {
          setIsAuthenticated(true);
          console.log('User authenticated, staying in update-password mode');
        } else {
          // Switch to forgot-password mode if not authenticated
          console.log('No user found, switching to forgot-password mode');
          setMode('forgot-password');
        }
      };
      checkAuth();
    }
  }, [mode, supabase.auth]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (mode === 'forgot-password') {
      // Only email validation for forgot password
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else if (mode === 'update-password') {
      // Password validation for update password
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Original validation for login/signup
      // Email validation
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      // Password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
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
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error and success when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (success) {
      setSuccess(null);
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
      // Normalize inputs
      const email = formData.email.trim().toLowerCase();
      const name = formData.name.trim();

      // Check for username uniqueness before proceeding
      const { data: existingUser } = await supabase
        .from('users')
        .select('name')
        .eq('name', name)
        .single();

      if (existingUser) {
        setErrors({ name: 'This username is already taken. Please choose another one.' });
        return;
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            name,
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        const message = error.message || 'Unable to sign up';
        if (/already\s*registered|exists/i.test(message)) {
          setErrors({ email: 'An account with this email already exists' });
        } else if (/password/i.test(message)) {
          setErrors({ password: message });
        } else if (/email/i.test(message)) {
          setErrors({ email: message });
        } else {
          setErrors({ general: message });
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
            email,
            name,
            image_url: null,
            spotify_url: null,
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
          // Update the session to trigger re-renders
          await updateSession();

          onClose();
          // Reset form
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
          });
          // Redirect to activity page
          router.push('/activity');
          router.refresh(); // Force a refresh to update all components
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account, then sign in.');
          setMode('login');
          // Clear form data
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
          });
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
        setErrors({ general: 'No account found with this username or email. Please check your credentials or sign up for a new account.' });
        return;
      }

      const result = await signIn('credentials', {
        email: email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setErrors({ general: 'Incorrect username OR password. Please check your credentials and try again.' });
        } else {
          setErrors({ general: 'Login failed. Please try again.' });
        }
      } else if (result?.ok) {
        // Update the session to trigger re-renders
        await updateSession();

        onClose();
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
        });
        // Redirect to activity page
        router.push('/activity');
        router.refresh(); // Force a refresh to update all components
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      setErrors({ email: 'Please enter your email address.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/api/auth/confirm?next=/?auth=update-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        // Display the actual error message from Supabase (e.g. "Rate limit exceeded", "User not found")
        setErrors({ general: error.message });
      } else {
        setSuccess('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
        setFormData(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        setErrors({ general: 'Failed to update password. Please try again.' });
      } else {
        setSuccess('Password updated successfully! You can now sign in with your new password.');
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
        });

        // Close modal and redirect after a delay
        setTimeout(() => {
          onClose();
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Password update error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    if (mode === 'forgot-password') {
      setMode('login');
    } else if (mode === 'update-password') {
      // Can't switch from update-password mode
      return;
    } else {
      setMode(mode === 'login' ? 'signup' : 'login');
    }
    setErrors({});
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
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
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot-password' && 'Forgot Password'}
            {mode === 'update-password' && 'Update Password'}
          </h2>
          <p className="text-[#5C5537]/70 mt-2">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'signup' && 'Join the Trackboxd community'}
            {mode === 'forgot-password' && "Enter your email address and we'll send you a link to reset your password."}
            {mode === 'update-password' && 'Enter your new password below.'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-[#5C5537]/10 border border-[#5C5537]/20 text-[#5C5537] rounded-lg">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-4 p-4 bg-[#5C5537]/10 border border-[#5C5537]/20 text-[#5C5537] rounded-lg">
            <p className="text-sm">{errors.general}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={
          mode === 'login' ? handleLogin :
            mode === 'signup' ? handleSignup :
              mode === 'forgot-password' ? handleForgotPassword :
                handleUpdatePassword
        } className="space-y-4">
          {/* Email Field - shown for login, signup, and forgot-password */}
          {(mode === 'login' || mode === 'signup' || mode === 'forgot-password') && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5C5537] mb-2">
                {mode === 'login' ? 'Email or Username *' : 'Email Address *'}
              </label>
              <div className="relative">
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                    }`}
                  placeholder={
                    mode === 'login' ? 'Enter your email or username' :
                      mode === 'forgot-password' ? 'Enter your email address' :
                        'Enter your email'
                  }
                  required
                />
              </div>
              {errors.email && <p className="text-[#5C5537] text-xs mt-1">{errors.email}</p>}
            </div>
          )}

          {/* Password Field (login only) */}
          {mode === 'login' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#5C5537] mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-4 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.password
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
              {errors.password && <p className="text-[#5C5537] text-xs mt-1">{errors.password}</p>}

              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-[#5C5537]/70 hover:text-[#5C5537] hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          {/* Password Fields for update-password mode */}
          {mode === 'update-password' && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#5C5537] mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                      }`}
                    placeholder="Enter your new password"
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
                {errors.password && <p className="text-[#5C5537] text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5C5537]/50" size={16} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                      }`}
                    placeholder="Confirm your new password"
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
                {errors.confirmPassword && <p className="text-[#5C5537] text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          {/* Signup-only fields */}
          {mode === 'signup' && (
            <>
              {/* Username Field (stored as name) */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Username *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.name
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-[#5C5537]/20 focus:ring-[#5C5537]/50'
                      }`}
                    placeholder="Choose a username"
                    required
                  />
                </div>
                {errors.name && <p className="text-[#5C5537] text-xs mt-1">{errors.name}</p>}
              </div>
              {/* Move Password + Confirm Password to bottom */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.password
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
                {errors.password && <p className="text-[#5C5537] text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#5C5537] mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 pr-12 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white ${errors.confirmPassword
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
                {errors.confirmPassword && <p className="text-[#5C5537] text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5C5537] text-white py-2 px-4 rounded-md hover:bg-[#3E3725] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' :
              mode === 'login' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                  mode === 'forgot-password' ? 'Send Reset Email' :
                    'Update Password'
            }
          </button>
        </form>

        {/* Mode Switch - Only show for login/signup modes */}
        {(mode === 'login' || mode === 'signup') && (
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
        )}

        {/* Back to Login - Show for forgot-password mode */}
        {mode === 'forgot-password' && (
          <div className="text-center mt-6 pt-6 border-t border-[#5C5537]/10">
            <p className="text-[#5C5537]/70">
              Remember your password?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#5C5537] hover:underline font-medium"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
