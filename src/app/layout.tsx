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
import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";

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
  title: "Jerry Can Spirits® | Veteran-Owned Premium British Rum - Engineered for Reliability, Designed for Adventure",
  description: "Veteran-owned premium British rum with authentic military heritage. Founded by Royal Corps of Signals veterans. Small-batch spirits engineered for reliability, designed for adventure. Expedition Ready.",
  keywords: "veteran-owned rum, British spirits, military heritage rum, premium rum, Royal Corps of Signals, expedition rum, small-batch spirits, craft rum, British rum, sustainable spirits",
  authors: [{ name: "Jerry Can Spirits®" }],
  alternates: {
    canonical: "https://jerrycanspirits.co.uk",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://jerrycanspirits.co.uk",
    siteName: "Jerry Can Spirits®",
    title: "Jerry Can Spirits® | Veteran-Owned Premium British Rum",
    description: "Veteran-owned British rum. Engineered for reliability, designed for adventure. Expedition Ready.",
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
    title: "Jerry Can Spirits® | Veteran-Owned Premium British Rum",
    description: "Veteran-owned British rum. Engineered for reliability, designed for adventure. Expedition Ready.",
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
        <OrganizationSchema />
        <WebsiteSchema />

        <CartProvider>
          {/* Skip to Content Link - Accessibility */}
          <a
            href="#main-content"
            className="fixed top-4 left-4 z-[9999] px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg shadow-lg outline-none ring-2 ring-gold-300 -translate-y-[200%] focus:translate-y-0 transition-transform duration-200"
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
