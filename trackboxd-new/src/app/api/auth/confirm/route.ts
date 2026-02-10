import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('Auth confirm route called with:', { token_hash: !!token_hash, code: !!code, type, next });

  const supabase = createClient(await cookies());

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('Code exchange result:', { error: error?.message });

      if (!error) {
        console.log('Redirecting to next URL:', next);
        return NextResponse.redirect(new URL(next, request.url));
      } else {
        console.error('Code exchange failed:', error.message);
        return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}`, request.url));
      }
    } catch (err) {
      console.error('Error during code exchange:', err);
      return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent('Unknown error during code exchange')}`, request.url));
    }
  } else if (token_hash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      });

      console.log('OTP verification result:', { error: error?.message });

      if (!error) {
        // Redirect to home page with update-password modal for password recovery
        // Note: With implicit flow 'type' tells us it's recovery.
        // With PKCE code flow (above), we rely on 'next' param.
        if (type === 'recovery') {
          console.log('Redirecting to update-password modal');
          return NextResponse.redirect(new URL('/?auth=update-password', request.url));
        }
        // For other types, redirect to the next URL
        console.log('Redirecting to next URL:', next);
        return NextResponse.redirect(new URL(next, request.url));
      } else {
        console.error('OTP verification failed:', error.message);
        return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}`, request.url));
      }
    } catch (err) {
      console.error('Error during OTP verification:', err);
      return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent('Unknown error occurred')}`, request.url));
    }
  } else {
    console.log('Missing token_hash, type, or code:', { token_hash: !!token_hash, type, code: !!code });
    return NextResponse.redirect(new URL(`/auth/auth-code-error?error=${encodeURIComponent('Missing required authentication parameters (code or token_hash)')}`, request.url));
  }

  // Return the user to an error page with instructions
  console.log('Redirecting to auth-code-error');
  return NextResponse.redirect(new URL('/auth/auth-code-error?error=unknown_fallthrough', request.url));
}