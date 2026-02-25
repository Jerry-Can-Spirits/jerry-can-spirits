import dynamic from 'next/dynamic';
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import PreOrderSection from "@/components/PreOrderSection";
import EmailSignup from "@/components/EmailSignup";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import SupportingOurForces from "@/components/SupportingOurForces";
import FieldManualPreview from "@/components/FieldManualPreview";
import WhyJerryCan from "@/components/WhyJerryCan";
import HomepageFAQ from "@/components/HomepageFAQ";
import ScrollReveal from "@/components/ScrollReveal";
import TickerStrip from "@/components/TickerStrip";
import Link from 'next/link'
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
  description: "Veteran-owned premium spiced rum by Royal Signals veterans. Small-batch craft spirits with Madagascan vanilla and Ceylon cinnamon.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/",
  },
  openGraph: {
    title: "Jerry Can Spirits | Veteran-Owned Premium British Rum",
    description: "Veteran-owned premium spiced rum by Royal Signals veterans. Small-batch craft spirits with Madagascan vanilla and Ceylon cinnamon.",
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
      "description": "Veteran-owned premium British spiced rum with authentic military heritage. Founded by Royal Corps of Signals veterans. Small-batch craft spirits engineered for reliability, designed for adventure.",
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
        "streetAddress": "167-169 Great Portland Street",
        "addressLocality": "London",
        "addressRegion": "Greater London",
        "postalCode": "W1W 5PA",
        "addressCountry": "GB"
      },
      "sameAs": [
        "https://www.facebook.com/jerrycanspirits",
        "https://www.instagram.com/jerrycanspirits"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "telephone": "+44 7521 220541",
        "email": "hello@jerrycanspirits.co.uk"
      },
      "knowsAbout": ["Premium Spiced Rum", "British Spirits", "Military Heritage", "Veteran-Owned Business", "Small-Batch Distilling", "Military Rum"],
      "award": "Armed Forces Covenant Signatory"
    },
    // LocalBusiness schema for local SEO
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://jerrycanspirits.co.uk/#business",
      "name": "Jerry Can Spirits",
      "image": "https://jerrycanspirits.co.uk/images/Logo.webp",
      "url": "https://jerrycanspirits.co.uk",
      "telephone": "+44 7521 220541",
      "email": "hello@jerrycanspirits.co.uk",
      "priceRange": "££",
      "description": "Veteran-owned British spirits company producing premium spiced rum. Founded by Royal Corps of Signals veterans. Military rum crafted with purpose.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "167-169 Great Portland Street",
        "addressLocality": "London",
        "addressRegion": "Greater London",
        "postalCode": "W1W 5PA",
        "addressCountry": "GB"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 51.5197,
        "longitude": -0.1437
      },
      "sameAs": [
        "https://www.facebook.com/jerrycanspirits",
        "https://www.instagram.com/jerrycanspirits"
      ],
      "currenciesAccepted": "GBP",
      "paymentAccepted": "Credit Card, Debit Card, PayPal",
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      }
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
    },
    // Event schema for product launch
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "Jerry Can Spirits Expedition Spiced Rum Launch",
      "description": "Official launch of Jerry Can Spirits Expedition Spiced Rum - premium veteran-owned British craft rum. Pre-orders ship first.",
      "startDate": "2026-04-06",
      "endDate": "2026-04-06",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "location": {
        "@type": "VirtualLocation",
        "url": "https://jerrycanspirits.co.uk"
      },
      "image": "https://jerrycanspirits.co.uk/images/hero/hero-spiced.webp",
      "organizer": {
        "@type": "Organization",
        "name": "Jerry Can Spirits",
        "url": "https://jerrycanspirits.co.uk"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://jerrycanspirits.co.uk/shop/drinks",
        "price": "35",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/PreOrder",
        "validFrom": "2025-07-01"
      }
    }
  ];

  return (
    <>
      <ScrollToHash />
      <StructuredData data={structuredData} />
      <div>
        <HeroSection />

        {/* Pre-Order Section - Primary CTA */}
        <ScrollReveal>
          <PreOrderSection />
        </ScrollReveal>

        {/* Email Signup */}
        <ScrollReveal delay={1}>
          <EmailSignup />
        </ScrollReveal>

        {/* Why Jerry Can - Value Proposition */}
        <ScrollReveal>
          <WhyJerryCan />
        </ScrollReveal>

        {/* FAQ Section with Schema Markup */}
        <HomepageFAQ />

        {/* Founder Story Snippet */}
        <ScrollReveal>
          <FounderStorySnippet />
        </ScrollReveal>

        {/* Supporting Our Forces - Armed Forces Commitments */}
        <ScrollReveal>
          <SupportingOurForces />
        </ScrollReveal>

        {/* Social Proof Ticker */}
        <TickerStrip
          items={["12+ Years Service", "UK First Philosophy", "Small Batch Quality", "Forces Covenant", "Veteran Owned", "Welsh Distilled"]}
          className="py-4 bg-jerry-green-900/80 border-y border-gold-500/20"
        />

        {/* SEO-Rich Content Section - Veteran-Owned British Rum */}
        <section className="py-16 bg-jerry-green-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <ScrollReveal>
              <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Why We Started Making Rum
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    We didn't set out to start a rum company. Between us, we served 17 years in the Royal Corps of Signals. What we wanted was simple: a proper drink to share with mates - something with character, made by people who give a damn. When we couldn't find it, we decided to make it ourselves.
                  </p>
                  <p>
                    Working with <Link href="/friends/" className="text-gold-300 hover:text-gold-400 underline">Spirit of Wales Distillery</Link>, we blend Caribbean rum with Welsh brewery molasses and put it through their pot stills. The result? Vanilla and caramel upfront, warm spice through the middle, and a finish smooth enough to sip neat - but bold enough to hold its own in a cocktail.
                  </p>
                  <p>
                    Whether you're mixing drinks at home or just unwinding after a long week, this is rum that doesn't let you down. We built it that way on purpose.
                  </p>
                </div>
              </div>
              </ScrollReveal>

              <ScrollReveal delay={1}>
              <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Why We Do It This Way
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    We work with what's close to home where we can. Our rum is distilled in Wales using Welsh water, and the molasses comes partly from a local brewery's beer production - good ingredients that would otherwise go to waste. It's not about slapping 'eco-friendly' on the label. It's just how we think things should be done.
                  </p>
                  <p>
                    We signed the Armed Forces Covenant because supporting veterans isn't a marketing angle for us - it's personal. A portion of every sale goes to forces charities. We guarantee job interviews for veterans. It's baked into how we run the company, not bolted on afterwards.
                  </p>
                  <p>
                    There's a reason we named ourselves after the jerry can. It wasn't designed to look good on a shelf. It was designed to work - in the desert, in the Arctic, wherever it was needed. That's the standard we hold ourselves to. Rum that does what it's supposed to do, every single time.
                  </p>
                </div>
              </div>
              </ScrollReveal>
            </div>

            {/* Key Features Grid */}
            <div className="mt-12 grid md:grid-cols-4 gap-6">
              <ScrollReveal delay={0}>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">12+ Years Service</h3>
                  <p className="text-parchment-300 text-sm">Royal Corps of Signals veterans who built their rum the same way they approached everything else. Carefully, without shortcuts.</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={1}>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">UK First Philosophy</h3>
                  <p className="text-parchment-300 text-sm">Welsh distillery, Welsh brewery molasses, real botanicals</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Small Batch. Properly Made.</h3>
                  <p className="text-parchment-300 text-sm">Pot stilled at Spirit of Wales Distillery, Newport. Extended copper contact. Every batch small enough to pay attention to.</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={3}>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Forces Covenant</h3>
                  <p className="text-parchment-300 text-sm">Supporting veterans and military charities with every bottle sold</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Field Manual Preview */}
        <ScrollReveal>
          <FieldManualPreview />
        </ScrollReveal>

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
                  Field Reports
                </h2>
                <p className="text-parchment-200 text-lg max-w-2xl mx-auto">
                  We&apos;ll let the bottles do the talking.
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
