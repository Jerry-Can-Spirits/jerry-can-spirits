import type { Metadata } from "next";
import Script from "next/script";
import dynamic from "next/dynamic";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShippingBanner from "@/components/ShippingBanner";
import ClientWrapper from "@/components/ClientWrapper";

// Lazy load non-critical layout components
const CartographicBackground = dynamic(
  () => import("@/components/CartographicBackground"),
  { loading: () => null }
);
const CartDrawer = dynamic(() => import("@/components/CartDrawer"));
const SocialProofToast = dynamic(() => import("@/components/SocialProofToast"));
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import { CartProvider } from "@/contexts/CartContext";
import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import FacebookPixel, { PixelPageView } from "@/components/FacebookPixel";
import GoogleTag from "@/components/GoogleTag";
import KlaviyoScript from "@/components/KlaviyoScript";
import MetricoolScript from "@/components/MetricoolScript";
import AhrefsAnalytics from "@/components/AhrefsAnalytics";
import SentryReplayConsent from "@/components/SentryReplayConsent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: true,
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ['Courier New', 'monospace'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jerrycanspirits.co.uk'),
  title: {
    template: '%s | Jerry Can Spirits®',
    default: 'Jerry Can Spirits® | Veteran-Owned British Rum',
  },
  keywords: "veteran-owned rum, British spirits, military heritage rum, premium rum, Royal Corps of Signals, expedition rum, small-batch spirits, craft rum, British rum, sustainable spirits",
  authors: [{ name: "Jerry Can Spirits®" }],
  verification: {
    other: {
      'ahrefs-site-verification': 'a39776b56e887b4fb825fcb799843fbe1cfca30d7d9e618afefd28ee7e614b52',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Jerry Can Spirits®",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jerry Can Spirits® — Veteran-Owned British Rum, distilled in Wales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Synchronous JS detection — sets html.js before CSS is applied.
            Scroll reveal animations only hide content when JS is running,
            ensuring crawlers without JS see all content at full opacity. */}
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }}
        />

        {/* Google Consent Mode v2 Defaults - runs after interactive, before any Google tags fire */}
        {/* Cookiebot will update these values when user gives consent */}
        <Script
          id="google-consent-defaults"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("consent","default",{ad_personalization:"denied",ad_storage:"denied",ad_user_data:"denied",analytics_storage:"denied",functionality_storage:"denied",personalization_storage:"denied",security_storage:"granted"});gtag("set","ads_data_redaction",true);gtag("set","url_passthrough",false);`,
          }}
        />

        {/* Cookiebot Consent Management - loads after page interactive for better LCP */}
        {/* Tracking is already blocked by default consent settings above */}
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="ac4fd2fb-f5c7-435e-a8fb-2fe80936e682"
          data-blockingmode="auto"
          strategy="afterInteractive"
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jerry Can Spirits®" />
        <meta name="facebook-domain-verification" content="2rv5ogxoockin4xfzl2ioxkn4rbpxu" />

        {/* Critical Third-Party Connections - Preconnect for faster loading */}
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://imagedelivery.net" crossOrigin="anonymous" />
        {/* Non-Critical Third-Party Connections - DNS Prefetch only */}
        <link rel="preconnect" href="https://static.klaviyo.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://widget.trustpilot.com" />
        <link rel="dns-prefetch" href="https://cloudflareinsights.com" />

        {/* Klaviyo is now loaded via KlaviyoScript component with consent */}

      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} antialiased min-h-screen bg-jerry-green-900 text-foreground`}
        suppressHydrationWarning
      >
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <OrganizationSchema />
        <WebsiteSchema />
        <FacebookPixel />
        <PixelPageView />
        <GoogleTag />
        <KlaviyoScript />
        <MetricoolScript />
        <AhrefsAnalytics />
        <SentryReplayConsent />

        <CartProvider>
          {/* Skip to Content Link - Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only fixed top-4 left-4 z-[9999] px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-300 transition-all duration-200"
          >
            Skip to main content
          </a>

          <ClientWrapper>
          {/* Unified Cartographic Background */}
          <CartographicBackground opacity={0.75} showCoordinates={true} showCompass={true} className="fixed inset-0 z-0 pointer-events-none" />

          <div className="relative z-10">
            <Header />

            {/* Main content with proper spacing for fixed header + announcement bar */}
            <main id="main-content" className="pt-20" style={{ paddingTop: 'calc(5rem + var(--announcement-height, 0px))' }}>
              {children}
            </main>
            
            <ShippingBanner />
            <Footer />
          </div>
          
          {/* Consent now handled by Cookiebot CMP */}
        </ClientWrapper>

        {/* Cart Drawer */}
        <CartDrawer />

        {/* Social Proof Toast */}
        <SocialProofToast />

        {/* Google AdSense - consent-gated (statistics) + lazy loaded via requestIdleCallback.
            Uses dangerouslySetInnerHTML instead of next/script to avoid data-nscript attribute
            which AdSense rejects. Only loads after Cookiebot grants statistics consent. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var c=function(){var s=document.createElement('script');s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5758288828569326';s.crossOrigin='anonymous';s.async=true;document.body.appendChild(s)};var load=function(){if('requestIdleCallback' in window){requestIdleCallback(c)}else{setTimeout(c,3000)}};if(typeof Cookiebot!=='undefined'&&Cookiebot.consent&&Cookiebot.consent.statistics){load()}window.addEventListener('CookiebotOnAccept',function(){if(typeof Cookiebot!=='undefined'&&Cookiebot.consent&&Cookiebot.consent.statistics){load()}})})();`,
          }}
        />
        </CartProvider>
      </body>
    </html>
  );
}
