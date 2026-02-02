'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AgeGate from './AgeGate';

interface ClientWrapperProps {
  children: React.ReactNode;
}

// Known bot user agents - check client-side as fallback
const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'facebot', 'ia_archiver', 'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
  'rogerbot', 'screaming frog', 'sitebulb', 'deepcrawl', 'oncrawl', 'seobilitybot',
  'serpstatbot', 'dataforseo', 'surfer bot', 'surfer', 'twitterbot', 'linkedinbot', 'pinterestbot',
  'whatsapp', 'telegrambot', 'w3c_validator', 'lighthouse', 'pagespeed', 'gtmetrix',
  'mediapartners-google', 'adsbot-google', 'apis-google', 'google-inspectiontool',
  'chrome-lighthouse', 'headlesschrome', 'phantomjs', 'prerender', 'crawl', 'spider', 'bot'
];

// Check if the request is from a known bot
function checkIsBot(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for bot cookie set by middleware
  if (document.cookie.includes('isBot=true')) return true;

  // Fallback: check user agent client-side
  const ua = navigator.userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBot, setIsBot] = useState(false);
  const pathname = usePathname();

  const handleAgeVerification = () => {
    setIsAgeVerified(true);
  };

  // Legal pages that should be accessible without age verification
  // Use startsWith to handle both with and without trailing slashes
  const legalPages = ['/terms-of-service', '/privacy-policy', '/cookie-policy'];
  const isLegalPage = legalPages.some(page => pathname.startsWith(page));

  // Check localStorage on mount and handle navigation protection
  useEffect(() => {
    const verified = localStorage.getItem('ageVerified') === 'true';
    const botDetected = checkIsBot();

    // Allow bypass via URL parameter for SEO audits (e.g., ?seo_audit=true)
    const urlParams = new URLSearchParams(window.location.search);
    const auditBypass = urlParams.get('seo_audit') === 'true';

    // Preserve affiliate tracking parameters (dt_id for Shopify Collabs)
    const dtId = urlParams.get('dt_id');
    if (dtId) {
      // Store affiliate tracking ID for the session
      sessionStorage.setItem('affiliate_dt_id', dtId);
    }

    setIsAgeVerified(verified);
    setIsBot(botDetected || auditBypass);
    setIsLoading(false);

    // Note: We no longer redirect unverified users to home.
    // The age gate overlay covers the content for regular users,
    // while content always renders underneath for SEO (Googlebot sees full content).
    // The previous redirect was causing Google to report "Page with redirect" for all pages.
  }, [pathname, isLegalPage]);

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
  const shouldBypassGate = isAgeVerified || isLegalPage || isBot;

  return (
    <>
      {/* Age gate overlays on top - content always renders underneath for SEO */}
      {!shouldBypassGate && (
        <AgeGate onVerified={handleAgeVerification} />
      )}
      {/* Always render children - crawlers see the content in DOM */}
      {children}
    </>
  );
}