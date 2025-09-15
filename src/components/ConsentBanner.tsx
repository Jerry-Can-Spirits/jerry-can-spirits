'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, string | boolean>) => void;
  }
}

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    advertising: false,
    personalization: false
  });

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }

    // Add global function to recall banner (for testing/management)
    (window as typeof window & { showCookieBanner?: () => void }).showCookieBanner = () => {
      localStorage.removeItem('cookieConsent');
      setShowBanner(true);
    };
  }, []);

  const updateConsent = (consent: {
    analytics: boolean;
    advertising: boolean;
    personalization: boolean;
  }) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': consent.analytics ? 'granted' : 'denied',
        'ad_storage': consent.advertising ? 'granted' : 'denied',
        'ad_user_data': consent.advertising ? 'granted' : 'denied',
        'ad_personalization': consent.personalization ? 'granted' : 'denied',
      });
    }

    // Store consent choices
    localStorage.setItem('cookieConsent', JSON.stringify({
      analytics: consent.analytics,
      advertising: consent.advertising,
      personalization: consent.personalization,
      timestamp: Date.now()
    }));

    setShowBanner(false);
  };

  const acceptAll = () => {
    updateConsent({
      analytics: true,
      advertising: true,
      personalization: true
    });
  };

  const rejectAll = () => {
    updateConsent({
      analytics: false,
      advertising: false,
      personalization: false
    });
  };

  const acceptEssential = () => {
    updateConsent({
      analytics: true,
      advertising: false,
      personalization: false
    });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-jerry-green-800 border-t border-jerry-gold-500/20 p-4 z-50 shadow-lg">
      <div className="container mx-auto max-w-6xl">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-playfair font-semibold text-lg mb-2">
                Cookie Consent
              </h3>
              <p className="text-white text-sm">
                We use cookies to improve your experience on our site, analyze traffic, and for marketing purposes. 
                You can manage your preferences below.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-white border border-jerry-gold-500/50 rounded hover:bg-jerry-gold-500/20 hover:border-jerry-gold-400 hover:scale-105 transition-all text-sm shadow-md"
              >
                Manage Preferences
              </button>
              <button
                onClick={rejectAll}
                className="px-4 py-2 text-white border border-jerry-gold-500/50 rounded hover:bg-jerry-gold-500/20 hover:border-jerry-gold-400 hover:scale-105 transition-all text-sm shadow-md"
              >
                Reject All
              </button>
              <button
                onClick={acceptEssential}
                className="px-4 py-2 bg-jerry-gold-600 text-white rounded hover:bg-jerry-gold-500 hover:scale-105 transition-all text-sm font-medium shadow-lg"
              >
                Accept Essential
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 bg-jerry-gold-500 text-white rounded hover:bg-jerry-gold-400 hover:scale-105 transition-all text-sm font-medium shadow-lg"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-playfair font-semibold text-lg">
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-white hover:text-jerry-gold-100 text-xl hover:scale-110 transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-jerry-green-700/50 rounded">
                <div>
                  <h4 className="text-white font-medium">Essential Cookies</h4>
                  <p className="text-white text-xs">Required for the website to function properly</p>
                </div>
                <div className="text-white bg-jerry-gold-500 px-2 py-1 rounded text-xs font-medium">
                  Always Active
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-jerry-green-700/30 rounded">
                <div>
                  <h4 className="text-white font-medium">Analytics Cookies</h4>
                  <p className="text-white text-xs">Help us understand how visitors interact with our website</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  />
                  <div className={`w-11 h-6 rounded-full relative transition-all duration-300 hover:scale-105 ${preferences.analytics ? 'bg-yellow-500' : 'bg-slate-500'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-all duration-300 ${preferences.analytics ? 'left-[22px]' : 'left-[2px]'}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-jerry-green-700/30 rounded">
                <div>
                  <h4 className="text-white font-medium">Advertising Cookies</h4>
                  <p className="text-white text-xs">Used to deliver relevant ads and measure campaign effectiveness</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.advertising}
                    onChange={(e) => setPreferences(prev => ({ ...prev, advertising: e.target.checked }))}
                  />
                  <div className={`w-11 h-6 rounded-full relative transition-all duration-300 hover:scale-105 ${preferences.advertising ? 'bg-yellow-500' : 'bg-slate-500'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-all duration-300 ${preferences.advertising ? 'left-[22px]' : 'left-[2px]'}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-jerry-green-700/30 rounded">
                <div>
                  <h4 className="text-white font-medium">Personalisation Cookies</h4>
                  <p className="text-white text-xs">Used to remember your preferences and provide personalised content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.personalization}
                    onChange={(e) => setPreferences(prev => ({ ...prev, personalization: e.target.checked }))}
                  />
                  <div className={`w-11 h-6 rounded-full relative transition-all duration-300 hover:scale-105 ${preferences.personalization ? 'bg-yellow-500' : 'bg-slate-500'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-all duration-300 ${preferences.personalization ? 'left-[22px]' : 'left-[2px]'}`}></div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={rejectAll}
                className="px-4 py-2 text-white border border-jerry-gold-500/50 rounded hover:bg-jerry-gold-500/20 hover:border-jerry-gold-400 transition-all text-sm"
              >
                Reject All
              </button>
              <button
                onClick={() => updateConsent({
                  analytics: preferences.analytics,
                  advertising: preferences.advertising,
                  personalization: preferences.personalization
                })}
                className="px-4 py-2 bg-jerry-gold-600 text-white rounded hover:bg-jerry-gold-500 hover:scale-105 transition-all text-sm font-medium shadow-lg"
              >
                Save Preferences
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 bg-jerry-gold-500 text-white rounded hover:bg-jerry-gold-400 hover:scale-105 transition-all text-sm font-medium shadow-lg"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}