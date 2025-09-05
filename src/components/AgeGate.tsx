'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
      localStorage.setItem('ageVerified', 'true');
      localStorage.setItem('selectedRegion', JSON.stringify(selectedRegion));
      setIsVisible(false);
      onVerified();
    } else {
      // Show branded rejection message
      setShowRejectionMessage(true);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-jerry-green-900 flex overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
      {/* Real Cartographic Background */}
      <CartographicBackground 
        opacity={0.8} 
        showCoordinates={true} 
        showCompass={true} 
        className="absolute inset-0 z-0" 
      />

      {/* Left side - Age verification form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Image
              src="/images/Logo.webp"
              alt="Jerry Can Spirits"
              width={200}
              height={80}
              className="mx-auto mb-8 w-auto h-auto"
              priority
            />
          </div>

          {/* Main question */}
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-gold-300 mb-2">
              ARE YOU OF LEGAL
            </h1>
            <h1 className="text-3xl font-serif font-bold text-gold-300 mb-8">
              DRINKING AGE?
            </h1>
          </div>

          {/* Region selector */}
          <div className="space-y-4">
            <label className="block text-gold-300 font-medium text-lg">
              Select Your Region
            </label>
            <select
              value={selectedRegion.code}
              onChange={(e) => {
                const region = regions.find(r => r.code === e.target.value);
                if (region) setSelectedRegion(region);
              }}
              className="w-full p-4 bg-jerry-green-800 border-2 border-gold-400 rounded-lg text-gold-300 font-medium text-lg focus:outline-none focus:border-gold-300 focus:ring-2 focus:ring-gold-300/20"
            >
              {regions.map((region) => (
                <option key={region.code} value={region.code} className="bg-jerry-green-800">
                  {region.name}
                </option>
              ))}
            </select>
            <p className="text-gold-400 text-sm">
              Legal drinking age: {selectedRegion.minAge}+ years
            </p>
          </div>

          {/* Age verification buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAgeVerification(true)}
              className="bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-lg"
            >
              I Am {selectedRegion.minAge}+
            </button>
            <button
              onClick={() => handleAgeVerification(false)}
              className="bg-metal-600 hover:bg-metal-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-lg"
            >
              Nope
            </button>
          </div>

          {/* Legal disclaimer */}
          <div className="text-center space-y-4">
            <p className="text-gold-400 text-sm leading-relaxed">
              You must be of legal drinking age to enter this website.
            </p>
            <p className="text-gold-400 text-sm leading-relaxed">
              This website uses cookies. By entering this site, I agree to the{' '}
              <a href="/terms-of-service" className="underline hover:text-gold-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="underline hover:text-gold-300 transition-colors">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Product image */}
      <div className="flex-1 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-jerry-green-900/20 to-jerry-green-900/60 z-10"></div>
        <Image
          src="/images/hero/hero-spiced.webp"
          alt="Jerry Can Spirits Bottle"
          fill
          className="object-cover object-center"
          priority
          sizes="50vw"
        />
      </div>

      {/* Branded Rejection Message Modal */}
      {showRejectionMessage && (
        <div className="absolute inset-0 bg-jerry-green-900/95 flex items-center justify-center z-20">
          <div className="bg-jerry-green-800 border-2 border-gold-400 rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🧭</div>
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