'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/actions/authActions';

export default function PreventBackNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      // Check if user is logged in
      const checkAuth = async () => {
        const token = await getToken();
        if (token) {
          // Prevent going back to login page if already logged in
          window.history.pushState(null, '', window.location.href);
        }
      };
      checkAuth();
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [router]);

  return null;
}