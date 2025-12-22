import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import CartographicBackground from "@/components/CartographicBackground";
import ClientWrapper from "@/components/ClientWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ConsentBanner from "@/components/ConsentBanner";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jerrycanspirits.co.uk'),
  title: "Jerry Can Spirits® | Premium British Rum - Swift & Sure, Expedition Ready",
  description: "Premium spirits engineered for adventure. Crafted with British precision and Caribbean soul for those who venture beyond the ordinary. Discover our expedition-ready rum collection.",
  keywords: "premium rum, British spirits, expedition rum, adventure spirits, Caribbean rum, craft spirits",
  authors: [{ name: "Jerry Can Spirits®" }],
  alternates: {
    canonical: "https://jerrycanspirits.co.uk",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://jerrycanspirits.co.uk",
    siteName: "Jerry Can Spirits®",
    title: "Jerry Can Spirits® | Premium British Rum",
    description: "Premium spirits engineered for adventure. Swift & Sure, Expedition Ready.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jerry Can Spirits® - Premium British Rum for Adventurers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jerry Can Spirits® | Premium British Rum",
    description: "Premium spirits engineered for adventure. Swift & Sure, Expedition Ready.",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jerry Can Spirits®" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=UavTvg"></script>
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} antialiased min-h-screen bg-jerry-green-900 text-foreground`}
      >
        <GoogleAnalytics />
        <ServiceWorkerRegistration />

        <CartProvider>
          {/* Skip to Content Link - Accessibility */}
          <a
            href="#main-content"
            className="absolute -top-full left-0 z-[9999] px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg shadow-lg focus:top-4 focus:left-4 focus:outline-none focus:ring-2 focus:ring-gold-300 transition-all"
          >
            Skip to main content
          </a>

          <ClientWrapper>
          {/* Unified Cartographic Background */}
          <CartographicBackground opacity={0.75} showCoordinates={true} showCompass={true} className="fixed inset-0 z-0" />

          {/* Promo Banner - Only show when there's an active promotion */}
          <div className="relative z-10">
            <PromoBanner
              message="🚀 Pre-launch: Be the first to know when Expedition Spiced launches!"
              ctaText="Notify Me"
              ctaLink="/notify"
              isVisible={true}
            />

            <Header />

            {/* Main content with proper spacing for fixed header */}
            <main id="main-content" className="pt-20">
              {children}
            </main>
            
            <Footer />
          </div>
          
          {/* Consent Banner */}
          <ConsentBanner />
        </ClientWrapper>

        {/* Cart Drawer */}
        <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
