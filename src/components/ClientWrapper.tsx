'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AgeGate from './AgeGate';
import { captureUtmParams } from '@/lib/utm';
import { isPourIqAppRoute } from '@/lib/trade-portal/nav';
import { AGE_COOKIE, AGE_COOKIE_VALUE } from '@/lib/age-gate';

interface ClientWrapperProps {
  children: React.ReactNode;
}

// Whether a visitor sees the gate is decided before first paint by the inline
// script in app/layout.tsx (cookie, storage, bot list) and acted on by
// AgeGate.tsx. This wrapper only decides which routes carry the gate at all.
export default function ClientWrapper({ children }: ClientWrapperProps) {
  const pathname = usePathname();

  // Legal pages that should be accessible without age verification
  // Use startsWith to handle both with and without trailing slashes
  const legalPages = ['/terms-of-service', '/privacy-policy', '/cookie-policy'];
  const isLegalPage = legalPages.some(page => pathname.startsWith(page));

  useEffect(() => {
    try {
      // A visitor verified before the cookie existed has only the localStorage
      // flag. /api/checkout reads the cookie, so restore it. SameSite=Lax (see
      // AgeGate.tsx): it must survive a cross-site top-level navigation from a
      // social link, or every Facebook/Instagram visitor is re-gated on entry.
      if (
        !document.cookie.includes(`${AGE_COOKIE}=${AGE_COOKIE_VALUE}`) &&
        localStorage.getItem(AGE_COOKIE) === AGE_COOKIE_VALUE
      ) {
        document.cookie = 'ageVerified=true; path=/; max-age=31536000; SameSite=Lax; Secure';
      }
    } catch {
      // Storage may be blocked by browser tracking prevention
    }

    // Preserve affiliate tracking parameters (dt_id for Shopify Collabs)
    try {
      const dtId = new URLSearchParams(window.location.search).get('dt_id');
      if (dtId) {
        sessionStorage.setItem('affiliate_dt_id', dtId);
      }
    } catch {
      // Session storage may be blocked
    }

    captureUtmParams();
  }, [pathname]);

  // No gate on legal pages (a minor may read them), the trade portal (its own
  // auth, B2B) or the /age-check route, which renders the gate itself for
  // links that predate the overlay.
  const carriesGate =
    !isLegalPage && !isPourIqAppRoute(pathname) && !pathname.startsWith('/age-check');

  return (
    <>
      {carriesGate && <AgeGate />}
      {/* Always render children - crawlers see the content in DOM */}
      {children}
    </>
  );
}
