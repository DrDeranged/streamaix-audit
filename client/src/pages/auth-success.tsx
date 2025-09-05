import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function AuthSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store the token in localStorage
      localStorage.setItem('auth-token', token);
      
      // Redirect to home page
      setLocation('/');
    } else {
      // No token, redirect back to auth page with error
      setLocation('/auth?error=no-token');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Processing login...</h1>
        <p className="text-slate-300">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}