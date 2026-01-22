import dynamic from 'next/dynamic';
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import PreOrderSection from "@/components/PreOrderSection";
import EmailSignup from "@/components/EmailSignup";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import FieldManualPreview from "@/components/FieldManualPreview";
import WhyJerryCan from "@/components/WhyJerryCan";
import type { Metadata } from 'next'

// Lazy load TrustpilotWidget (below the fold)
const TrustpilotWidget = dynamic(() => import('@/components/TrustpilotWidget'), {
  loading: () => (
    <div className="h-[150px] bg-jerry-green-800/50 rounded-lg animate-pulse" />
  ),
});

export const metadata: Metadata = {
  title: {
    absolute: "Jerry Can Spirits | Veteran-Owned Premium British Rum",
  },
  description: "Veteran-owned British rum by Royal Signals veterans. Premium small-batch craft spirits engineered for reliability, designed for adventure.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/",
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

        {/* Pre-Order Section - Primary CTA */}
        <PreOrderSection />

        {/* Email Signup */}
        <EmailSignup />

        {/* Why Jerry Can - Value Proposition */}
        <WhyJerryCan />

        {/* Founder Story Snippet */}
        <FounderStorySnippet />

        {/* SEO-Rich Content Section - Veteran-Owned British Rum */}
        <section className="py-16 bg-jerry-green-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Premium British Craft Rum for Modern Explorers
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    Discover Jerry Can Spirits - a veteran-owned British spirits brand where expedition-tested precision meets artisan craft. Founded by former Royal Corps of Signals servicemen, we partner with master distillers to transform premium Caribbean molasses into extraordinary small-batch rum that captures the spirit of adventure in every sip.
                  </p>
                  <p>
                    Our handcrafted rum delivers rich, complex flavours: indulge in velvety vanilla intertwined with warm caramel, complemented by exotic spice notes and a lingering smooth finish. Each batch is pot distilled at Spirit of Wales Distillery using copper-lined stills, where extended copper contact develops the deep, sophisticated character that defines premium craft spirits.
                  </p>
                  <p>
                    Perfect for crafting bold cocktails or savoring neat, our British rum is engineered for versatility. Whether you're mixing signature serves at home or toasting memorable moments with friends, Jerry Can Spirits delivers expedition-ready quality that never compromises on flavour.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Sustainable Craft Spirits with Purpose
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    Experience the difference sustainable sourcing makes. We champion British ingredients first - from locally-sourced botanicals to pure Welsh water - reducing our environmental impact while supporting UK producers. Combined with premium ethically-sourced Caribbean molasses, every bottle represents our commitment to responsible craft spirits that respect both tradition and our planet's future.
                  </p>
                  <p>
                    As proud Armed Forces Covenant signatories, we're building more than premium spirits - we're creating opportunities. Our veteran heritage informs everything: precision in process, reliability in quality, and unwavering standards. Try our craft rum and taste the dedication that comes from founders who understand what truly dependable means.
                  </p>
                  <p>
                    The jerry can wasn't designed for beauty - it was engineered for absolute reliability in the harshest conditions. We apply that same expedition-tested philosophy to every batch. When you choose Jerry Can Spirits, you're choosing British craft rum built for adventure, engineered for flavour, and designed to perform wherever your journey takes you.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features Grid */}
            <div className="mt-12 grid md:grid-cols-4 gap-6">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">12+ Years Service</h3>
                <p className="text-parchment-300 text-sm">Royal Corps of Signals veterans bringing military precision to craft spirits</p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">UK First Philosophy</h3>
                <p className="text-parchment-300 text-sm">British ingredients, Welsh distillation, sustainable local sourcing</p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Small Batch Quality</h3>
                <p className="text-parchment-300 text-sm">Copper-lined distillation creating complex flavors and smooth finish</p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Forces Covenant</h3>
                <p className="text-parchment-300 text-sm">Supporting veterans and military charities with every bottle sold</p>
              </div>
            </div>
          </div>
        </section>

        {/* Field Manual Preview */}
        <FieldManualPreview />

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
      </div>
    </>
  );
}
