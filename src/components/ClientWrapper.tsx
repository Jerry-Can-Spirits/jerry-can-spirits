'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AgeGate from './AgeGate';

interface ClientWrapperProps {
  children: React.ReactNode;
}

// Check if the request is from a known bot (set by middleware)
function checkIsBot(): boolean {
  if (typeof document === 'undefined') return false;
  // Check for bot cookie set by middleware
  return document.cookie.includes('isBot=true');
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBot, setIsBot] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleAgeVerification = () => {
    setIsAgeVerified(true);
  };

  // Legal pages that should be accessible without age verification
  const legalPages = ['/terms-of-service', '/privacy-policy', '/cookie-policy'];
  const isLegalPage = legalPages.includes(pathname);

  // Check localStorage on mount and handle navigation protection
  useEffect(() => {
    const verified = localStorage.getItem('ageVerified') === 'true';
    const botDetected = checkIsBot();

    setIsAgeVerified(verified);
    setIsBot(botDetected);
    setIsLoading(false);

    // If user is not verified and trying to access a non-legal page, redirect to home
    // But allow bots through for SEO purposes
    if (!verified && !botDetected && !isLegalPage && pathname !== '/') {
      router.push('/');
    }
  }, [pathname, isLegalPage, router]);

  // Show loading while checking verification status
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-jerry-green-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <div className="text-gold-300 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Bypass age gate for: verified users, legal pages, or known bots
  const shouldShowContent = isAgeVerified || isLegalPage || isBot;

  return (
    <>
      {!shouldShowContent && (
        <AgeGate onVerified={handleAgeVerification} />
      )}
      {shouldShowContent && children}
    </>
  );
}