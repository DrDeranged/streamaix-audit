import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

export default function AuthSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store the token in localStorage (using auth_token key for consistency)
      localStorage.setItem('auth_token', token);
      
      // Redirect to home page
      setLocation('/');
    } else {
      // No token, redirect back to auth page with error
      setLocation('/auth?error=no-token');
    }
  }, [setLocation]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-ink-page p-4">
      <Surface className="w-full max-w-md p-8 text-center sm:p-10">
        <SectionTitle as="h1" className="mb-4 text-2xl sm:text-3xl">
          Processing login...
        </SectionTitle>
        <p className="text-sm text-secondary sm:text-base">
          Please wait while we complete your authentication.
        </p>
      </Surface>
    </div>
  );
}