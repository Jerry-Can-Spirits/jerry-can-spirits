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
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.cookie.includes('ageVerified=true');
  });
  const [isBot, setIsBot] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.cookie.includes('isBot=true');
  });
  const pathname = usePathname();

  const handleAgeVerification = () => {
    setIsAgeVerified(true);
  };

  // Legal pages that should be accessible without age verification
  // Use startsWith to handle both with and without trailing slashes
  const legalPages = ['/terms-of-service', '/privacy-policy', '/cookie-policy'];
  const isLegalPage = legalPages.some(page => pathname.startsWith(page));

  // Handle backward-compat (migrate localStorage to cookie) and affiliate tracking
  useEffect(() => {
    try {
      const verifiedViaStorage = localStorage.getItem('ageVerified') === 'true';
      if (verifiedViaStorage && !isAgeVerified) {
        // Migrate: set cookie for future visits, update state
        document.cookie = 'ageVerified=true; path=/; max-age=31536000; SameSite=Strict; Secure';
        setIsAgeVerified(true);
      }
    } catch {
      // Storage may be blocked by browser tracking prevention
    }

    const botDetected = checkIsBot();
    const urlParams = new URLSearchParams(window.location.search);
    const auditBypass = urlParams.get('seo_audit') === 'true';
    if ((botDetected || auditBypass) && !isBot) setIsBot(true);

    // Preserve affiliate tracking parameters (dt_id for Shopify Collabs)
    try {
      const dtId = urlParams.get('dt_id');
      if (dtId) {
        sessionStorage.setItem('affiliate_dt_id', dtId);
      }
    } catch {
      // Session storage may be blocked
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
