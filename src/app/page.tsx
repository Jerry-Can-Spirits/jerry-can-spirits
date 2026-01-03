import HeroSection from "@/components/HeroSection";
import InstagramFeed from "@/components/InstagramFeed";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import KlaviyoEmbeddedForm from "@/components/KlaviyoEmbeddedForm";
import TrustpilotWidget from "@/components/TrustpilotWidget";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Jerry Can Spirits | Veteran-Owned Premium British Rum - Engineered for Reliability, Designed for Adventure",
  description: "Veteran-owned premium British rum with authentic military heritage. Founded by Royal Corps of Signals veterans. Small-batch spirits engineered for reliability, designed for adventure. Expedition Ready.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk",
  },
  openGraph: {
    title: "Jerry Can Spirits | Veteran-Owned Premium British Rum",
    description: "Veteran-owned British rum. Engineered for reliability, designed for adventure. Expedition Ready.",
  },
}

export default function Home() {
  // Structured data for SEO
  const structuredData = [
    // Organization schema
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.co.uk",
      "logo": "https://jerrycanspirits.co.uk/images/Logo.webp",
      "description": "Veteran-owned premium British rum with authentic military heritage. Founded by Royal Corps of Signals veterans. Small-batch spirits engineered for reliability, designed for adventure.",
      "foundingDate": "2025",
      "founders": [
        {
          "@type": "Person",
          "name": "Jerry Can Spirits Founder",
          "alumniOf": {
            "@type": "Organization",
            "name": "Royal Corps of Signals"
          },
          "hasOccupation": {
            "@type": "Occupation",
            "name": "British Armed Forces Veteran"
          }
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Blackpool",
        "addressRegion": "Lancashire",
        "addressCountry": "GB"
      },
      "sameAs": [
        "https://www.facebook.com/JerryCanSpirits",
        "https://www.instagram.com/jerrycanspirits"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "email": "hello@jerrycanspirits.co.uk"
      },
      "knowsAbout": ["Premium Rum", "British Spirits", "Military Heritage", "Veteran-Owned Business", "Small-Batch Distilling"],
      "award": "Armed Forces Covenant Signatory"
    },
    // Website schema
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.co.uk",
      "description": "Veteran-owned premium British rum - Engineered for reliability, designed for adventure. Expedition Ready.",
      "publisher": {
        "@type": "Organization",
        "name": "Jerry Can Spirits"
      }
    },
    // Brand schema
    {
      "@context": "https://schema.org",
      "@type": "Brand",
      "name": "Jerry Can Spirits",
      "logo": "https://jerrycanspirits.co.uk/images/Logo.webp",
      "slogan": "Engineered for reliability, designed for adventure",
      "description": "Veteran-owned premium British rum with authentic military heritage"
    }
  ];

  return (
    <>
      <ScrollToHash />
      <StructuredData data={structuredData} />
      <div>
        <HeroSection />
        <KlaviyoEmbeddedForm />

        {/* Trustpilot Reviews Section - Hidden until April 2026 launch */}
        {/* CSP is configured for Trustpilot, will activate automatically at launch */}
        {new Date() >= new Date('2026-04-01T00:00:00Z') && (
          <section className="py-16 bg-jerry-green-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
                  <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                    Field Reports
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gold-500 mb-4">
                  Trusted by Adventurers
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  See what our customers are saying about Jerry Can Spirits
                </p>
              </div>
              <div className="max-w-5xl mx-auto">
                <TrustpilotWidget
                  templateId="5406e65db0d04a09e042d5fc"
                  height="150px"
                  theme="dark"
                  stars=""
                />
              </div>
            </div>
          </section>
        )}

        {/* Instagram Feed Section */}
        <section className="py-16 bg-jerry-green-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
                <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                  Join the Adventure
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gold-500 mb-4">
                Follow Our Journey
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                See what our community is up to on Instagram
              </p>
            </div>
            <InstagramFeed
              postUrls={[
                'https://www.instagram.com/p/DQkRgIpDCOe/',  // Testing alternative post
                // 'https://www.instagram.com/p/DS940WfjDZV/',  // Original post (disabled for testing)
                // TO ADD MORE POSTS:
                // 1. Post something on Instagram (@jerrycanspirits)
                // 2. Click the three dots on the post → "Copy link"
                // 3. Paste the URL here
              ]}
              showCaptions={true}
              limit={6}
            />
          </div>
        </section>
      </div>
    </>
  );
}
