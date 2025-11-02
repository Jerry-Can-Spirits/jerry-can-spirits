import HeroSection from "@/components/HeroSection";
import KlaviyoSignup from "@/components/KlaviyoSignup";
import InstagramFeed from "@/components/InstagramFeed";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Jerry Can Spirits | Premium British Rum - Swift & Sure, Expedition Ready",
  description: "Premium British rum crafted for adventurers. Small-batch spirits with Caribbean soul and British precision. Join the waitlist for exclusive early access to expedition-ready rum.",
  openGraph: {
    title: "Jerry Can Spirits | Premium British Rum",
    description: "Premium British rum crafted for adventurers. Swift & Sure, Expedition Ready.",
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
      "description": "Premium spirits engineered for adventure. Crafted with British precision and Caribbean soul for those who venture beyond the ordinary.",
      "foundingDate": "2025",
      "founders": [
        {
          "@type": "Person",
          "name": "Jerry Can Spirits Founders"
        }
      ],
      "address": {
        "@type": "PostalAddress",
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
      }
    },
    // Website schema
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.co.uk",
      "description": "Premium British rum - Swift & Sure, Expedition Ready",
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
      "slogan": "Swift & Sure, Expedition Ready",
      "description": "Premium spirits engineered for adventure"
    }
  ];

  return (
    <>
      <ScrollToHash />
      <StructuredData data={structuredData} />
      <div>
        <HeroSection />
        <KlaviyoSignup />

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
                // Add your Instagram post URLs here when you have posts
                // Example: 'https://www.instagram.com/p/POST_ID/',
              ]}
              limit={6}
            />
          </div>
        </section>
      </div>
    </>
  );
}
