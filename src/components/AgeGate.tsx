'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CartographicBackground from './CartographicBackground';

const regions = [
  { code: 'GB', name: 'United Kingdom', minAge: 18 },
  { code: 'US', name: 'United States', minAge: 21 },
  { code: 'CA', name: 'Canada', minAge: 19 },
  { code: 'AU', name: 'Australia', minAge: 18 },
  { code: 'DE', name: 'Germany', minAge: 18 },
  { code: 'FR', name: 'France', minAge: 18 },
  { code: 'NL', name: 'Netherlands', minAge: 18 },
  { code: 'BE', name: 'Belgium', minAge: 18 },
  { code: 'ES', name: 'Spain', minAge: 18 },
  { code: 'IT', name: 'Italy', minAge: 18 },
];

interface AgeGateProps {
  onVerified: () => void;
}

export default function AgeGate({ onVerified }: AgeGateProps) {
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [isVisible, setIsVisible] = useState(true);
  const [showRejectionMessage, setShowRejectionMessage] = useState(false);

  useEffect(() => {
    // Prevent body scrolling when age gate is visible
    document.body.style.overflow = 'hidden';

    return () => {
      // Clean up: restore body scrolling
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Also handle scroll prevention when visibility changes
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isVisible]);

  const handleAgeVerification = (isOfAge: boolean) => {
    if (isOfAge) {
      try {
        localStorage.setItem('ageVerified', 'true');
        localStorage.setItem('selectedRegion', JSON.stringify(selectedRegion));
        document.cookie = 'ageVerified=true; path=/; max-age=31536000; SameSite=Strict; Secure';
      } catch {
        // Storage may be blocked by browser tracking prevention — proceed anyway
      }
      setIsVisible(false);
      onVerified();
    } else {
      // Show branded rejection message
      setShowRejectionMessage(true);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-jerry-green-900 overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
      {/* Real Cartographic Background */}
      <CartographicBackground
        opacity={0.8}
        showCoordinates={true}
        showCompass={true}
        className="absolute inset-0 z-0"
      />

      {/* Background image - visible on larger screens */}
      <div className="hidden md:block absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-gradient-to-r from-jerry-green-900 via-jerry-green-900/80 to-transparent z-10"></div>
        <Image
          src="/images/hero/hero-spiced.webp"
          alt="Jerry Can Spirits Expedition Spiced Rum bottle"
          fill
          className="object-cover object-right"
          priority
          quality={65}
          sizes="100vw"
          fetchPriority="high"
        />
      </div>

      {/* Centered content - full screen */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6 sm:p-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-6 sm:mb-8">
              <Image
                src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/images-logo-webp/public"
                alt="Jerry Can Spirits®"
                width={150}
                height={150}
                className="w-full h-full"
                priority
              />
            </div>
          </div>

          {/* Main question */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gold-300 mb-6 sm:mb-8">
              WELCOME, EXPLORER
            </h1>
            <p className="text-gold-400 text-base sm:text-lg mb-2">
              Please confirm you are of legal drinking age in your region.
            </p>
          </div>

          {/* Region selector */}
          <div className="space-y-3">
            <label htmlFor="region-selector" className="block text-gold-300 font-medium text-base sm:text-lg">
              Your Region
            </label>
            <select
              id="region-selector"
              value={selectedRegion.code}
              onChange={(e) => {
                const region = regions.find(r => r.code === e.target.value);
                if (region) setSelectedRegion(region);
              }}
              className="w-full p-3 sm:p-4 bg-jerry-green-800 border-2 border-gold-400 rounded-lg text-gold-300 font-medium text-base sm:text-lg focus:outline-none focus:border-gold-300 focus:ring-2 focus:ring-gold-300/20"
            >
              {regions.map((region) => (
                <option key={region.code} value={region.code} className="bg-jerry-green-800">
                  {region.name} ({region.minAge}+)
                </option>
              ))}
            </select>
          </div>

          {/* Age verification buttons */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => handleAgeVerification(true)}
              className="bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-base sm:text-lg"
            >
              Yes, Enter
            </button>
            <button
              onClick={() => handleAgeVerification(false)}
              className="bg-metal-600 hover:bg-metal-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-base sm:text-lg"
            >
              No, Exit
            </button>
          </div>

          {/* Legal disclaimer */}
          <div className="text-center pt-2">
            <p className="text-gold-400 text-xs sm:text-sm leading-relaxed">
              By entering, you accept our{' '}
              <Link href="/terms-of-service/" className="underline hover:text-gold-300 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy/" className="underline hover:text-gold-300 transition-colors">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Branded Rejection Message Modal */}
      {showRejectionMessage && (
        <div className="absolute inset-0 bg-jerry-green-900/95 flex items-center justify-center z-20">
          <div className="bg-jerry-green-800 border-2 border-gold-400 rounded-lg p-8 max-w-md mx-4 text-center">
            <h3 className="text-2xl font-serif font-bold text-gold-300 mb-4">
              Every Great Expedition Has Its Time
            </h3>
            <p className="text-gold-400 text-lg mb-6 leading-relaxed">
              Join us when you're ready to embark on the adventure - we'll be here when you're of age!
            </p>
            <button
              onClick={() => setShowRejectionMessage(false)}
              className="bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Understood, Explorer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}