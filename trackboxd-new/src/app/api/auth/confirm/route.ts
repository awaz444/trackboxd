import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  console.log('Auth confirm route called with:', { token_hash: !!token_hash, type, next });

  if (token_hash && type) {
    const supabase = createClient(await cookies());

    try {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      });

      console.log('OTP verification result:', { error: error?.message });

      if (!error) {
        // Redirect to home page with update-password modal for password recovery
        if (type === 'recovery') {
          console.log('Redirecting to update-password modal');
          return NextResponse.redirect(new URL('/?auth=update-password', request.url));
        }
        // For other types, redirect to the next URL
        console.log('Redirecting to next URL:', next);
        return NextResponse.redirect(new URL(next, request.url));
      } else {
        console.error('OTP verification failed:', error.message);
      }
    } catch (err) {
      console.error('Error during OTP verification:', err);
    }
  } else {
    console.log('Missing token_hash or type:', { token_hash: !!token_hash, type });
  }

  // Return the user to an error page with instructions
  console.log('Redirecting to auth-code-error');
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
}