import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import CartographicBackground from "@/components/CartographicBackground";
import ClientWrapper from "@/components/ClientWrapper";
// ConsentBanner replaced by Cookiebot CMP
// import ConsentBanner from "@/components/ConsentBanner";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import FacebookPixel from "@/components/FacebookPixel";
import AnnouncementBar from "@/components/AnnouncementBar";

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
    default: 'Jerry Can Spirits® | Veteran-Owned Premium British Rum',
  },
  keywords: "veteran-owned rum, British spirits, military heritage rum, premium rum, Royal Corps of Signals, expedition rum, small-batch spirits, craft rum, British rum, sustainable spirits",
  authors: [{ name: "Jerry Can Spirits®" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Jerry Can Spirits®",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jerry Can Spirits® - Veteran-Owned Premium British Rum with Military Heritage",
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
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Zaraz stub - prevents Cookiebot conflict with Cloudflare Zaraz */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.zaraz=window.zaraz||{q:[],consent:{set:function(){},setAll:function(){},getAll:function(){return{}}}};`
          }}
        />

        {/* Cookiebot Consent Management - must be first script */}
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="ac4fd2fb-f5c7-435e-a8fb-2fe80936e682"
          data-blockingmode="auto"
          strategy="beforeInteractive"
        />

        <link rel="manifest" href="/manifest.json" />
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Non-Critical Third-Party Connections - DNS Prefetch only */}
        <link rel="preconnect" href="https://static.klaviyo.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://widget.trustpilot.com" />
        <link rel="dns-prefetch" href="https://cloudflareinsights.com" />

        {/* Klaviyo Onsite.js - Required for embedded forms */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t="function"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();window.klaviyo.push(['account','UavTvg']);`
          }}
        />
        <script async src="https://static.klaviyo.com/onsite/js/UavTvg/klaviyo.js"></script>

        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5758288828569326"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} antialiased min-h-screen bg-jerry-green-900 text-foreground`}
      >
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <OrganizationSchema />
        <WebsiteSchema />
        <FacebookPixel />

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

          {/* Promo Banner - Only show when there's an active promotion */}
          <div className="relative z-10">
            <PromoBanner
              message="Pre-launch: Be the first to know when Expedition Spiced launches!"
              ctaText="Notify Me"
              ctaLink="/#newsletter-signup"
              isVisible={false}
            />

            {/* Announcement Bar - Pre-order promotion */}
            <AnnouncementBar />

            <Header />

            {/* Main content with proper spacing for fixed header + announcement bar */}
            <main id="main-content" className="pt-20" style={{ paddingTop: 'calc(5rem + var(--announcement-height, 0px))' }}>
              {children}
            </main>
            
            <Footer />
          </div>
          
          {/* Consent now handled by Cookiebot CMP */}
        </ClientWrapper>

        {/* Cart Drawer */}
        <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
