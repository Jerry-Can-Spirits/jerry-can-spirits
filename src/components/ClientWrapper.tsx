'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AgeGate from './AgeGate';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsAgeVerified(verified);
    setIsLoading(false);
    
    // If user is not verified and trying to access a non-legal page, redirect to home
    if (!verified && !isLegalPage && pathname !== '/') {
      router.push('/');
    }
  }, [pathname, isLegalPage, router]);

  // Show loading or nothing while checking verification status
  if (isLoading) {
    return null;
  }

  return (
    <>
      {!isAgeVerified && !isLegalPage && (
        <AgeGate onVerified={handleAgeVerification} />
      )}
      {(isAgeVerified || isLegalPage) && children}
    </>
  );
}