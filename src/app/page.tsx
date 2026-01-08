import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import PreOrderSection from "@/components/PreOrderSection";
import KlaviyoEmbeddedForm from "@/components/KlaviyoEmbeddedForm";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import FieldManualPreview from "@/components/FieldManualPreview";
import WhyJerryCan from "@/components/WhyJerryCan";
import TrustpilotWidget from "@/components/TrustpilotWidget";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Jerry Can Spirits | Veteran-Owned Premium British Rum",
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
      {/* SEO H1 - Server-rendered for crawlers */}
      <h1 className="sr-only">Jerry Can Spirits - Veteran-Owned Premium British Rum | Engineered for Reliability, Designed for Adventure</h1>
      <div>
        <HeroSection />

        {/* Pre-Order Section - Primary CTA */}
        <PreOrderSection />

        {/* Email Signup - Secondary CTA */}
        <KlaviyoEmbeddedForm />

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
                  Premium British Rum Crafted by Veterans
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    Jerry Can Spirits is a veteran-owned British rum distillery founded by former Royal Corps of Signals servicemen who served over 12 years in the British Armed Forces. We bring military precision, unwavering quality standards, and a passion for adventure to every bottle we craft.
                  </p>
                  <p>
                    Our premium small-batch rum is engineered with the same reliability we demanded from equipment in service. From Arctic deployments to desert outposts, we learned what you can truly depend on. Now we apply those exacting standards to creating exceptional British spirits for the modern explorer.
                  </p>
                  <p>
                    We partner with Spirit of Wales Distillery, utilizing advanced copper-lined distillation technology that creates multiple ester chambers for complex flavor development and an exceptionally smooth finish. This marriage of traditional craftsmanship and innovative engineering produces rum that stands apart from mass-produced alternatives.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Sustainable British Spirits with Military Heritage
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    Our commitment to sustainability reflects our respect for the environments we've operated in during military service. We prioritize UK-sourced ingredients wherever possible, reducing our carbon footprint while supporting British suppliers. Our ethically-sourced Caribbean molasses and sustainable production practices ensure we're building a brand that respects both tradition and the future.
                  </p>
                  <p>
                    As proud signatories of the Armed Forces Covenant, we actively support the veteran community through our business operations and partnerships. Every bottle sold helps us give back to the community that shaped our values and work ethic. We're committed to creating opportunities for veterans transitioning to civilian careers and supporting military charities.
                  </p>
                  <p>
                    The jerry can wasn't designed for beauty - it was engineered for absolute reliability. That same philosophy guides our rum production. Function over form. Purpose over pretense. Quality that performs when it matters most. This is premium British rum for those who venture beyond the ordinary.
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
