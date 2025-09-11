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
  metadataBase: new URL('https://jerrycanspirits.com'),
  title: "Jerry Can Spirits | Premium British Rum - Swift & Sure, Expedition Ready",
  description: "Premium spirits engineered for adventure. Crafted with British precision and Caribbean soul for those who venture beyond the ordinary. Discover our expedition-ready rum collection.",
  keywords: "premium rum, British spirits, expedition rum, adventure spirits, Caribbean rum, craft spirits",
  authors: [{ name: "Jerry Can Spirits" }],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://jerrycanspirits.com",
    siteName: "Jerry Can Spirits",
    title: "Jerry Can Spirits | Premium British Rum",
    description: "Premium spirits engineered for adventure. Swift & Sure, Expedition Ready.",
    images: [
      {
        url: "/images/Logo.webp",
        width: 1200,
        height: 630,
        alt: "Jerry Can Spirits Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jerry Can Spirits | Premium British Rum",
    description: "Premium spirits engineered for adventure. Swift & Sure, Expedition Ready.",
    images: ["/images/Logo.webp"],
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
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} antialiased min-h-screen bg-jerry-green-900 text-foreground`}
      >
        <GoogleAnalytics />
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
            <main className="pt-20">
              {children}
            </main>
            
            <Footer />
          </div>
          
          {/* Consent Banner */}
          <ConsentBanner />
        </ClientWrapper>
      </body>
    </html>
  );
}
