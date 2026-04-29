import ReactDOM from 'react-dom';
import HeroSection from "@/components/HeroSection";
import TrustpilotWidget from "@/components/TrustpilotWidget";
import HomepageExpeditionMap from "@/components/HomepageExpeditionMap";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import PreOrderSection from "@/components/PreOrderSection";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import SupportingOurForces from "@/components/SupportingOurForces";
import FieldManualPreview from "@/components/FieldManualPreview";
import WhyJerryCan from "@/components/WhyJerryCan";
import HomepageFAQ from "@/components/HomepageFAQ";
import PressAwards from "@/components/PressAwards";
import ScrollReveal from "@/components/ScrollReveal";
import TickerStrip from "@/components/TickerStrip";
import NewsletterSignup from "@/components/NewsletterSignup";
import Link from 'next/link'
import type { Metadata } from 'next'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'

export const revalidate = 60


export const metadata: Metadata = {
  title: {
    absolute: "Jerry Can Spirits | British Spiced Rum",
  },
  description: "Two Royal Signals veterans, one spiced rum. Real botanicals, pot-distilled in Wales. No artificial flavouring. No shortcuts. Now shipping.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/",
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Jerry Can Spirits | British Spiced Rum",
    description: "Two Royal Signals veterans, one spiced rum. Real botanicals, pot-distilled in Wales. No artificial flavouring. No shortcuts. Now shipping.",
    url: "https://jerrycanspirits.co.uk/",
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: "Jerry Can Spirits | British Spiced Rum",
    description: "Two Royal Signals veterans, one spiced rum. Real botanicals, pot-distilled in Wales. No artificial flavouring. No shortcuts. Now shipping.",
    images: OG_IMAGE,
  },
}

export default function Home() {
  const HERO_BASE = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/beed84d3-c77d-4ecf-c85f-29719bdea000'
  ReactDOM.preload(
    `${HERO_BASE}/w=1200,q=75`,
    {
      as: 'image',
      fetchPriority: 'high',
      imageSrcSet: [640, 750, 828, 1080, 1200].map(w => `${HERO_BASE}/w=${w},q=75 ${w}w`).join(', '),
      imageSizes: '(max-width: 768px) 100vw, 50vw',
    }
  )

  // Structured data for SEO
  const structuredData = [
    // Organization schema
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.co.uk",
      "logo": "https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/images-logo-webp/public",
      "description": "Veteran-owned British craft spirits with authentic military heritage. Founded by Royal Corps of Signals veterans. Small-batch spirits engineered for reliability, designed for adventure.",
      "foundingDate": "2025",
      "founders": [
        {
          "@type": "Person",
          "name": "Dan Freeman",
          "alumniOf": {
            "@type": "Organization",
            "name": "Royal Corps of Signals"
          },
          "hasOccupation": {
            "@type": "Occupation",
            "name": "British Armed Forces Veteran"
          }
        },
        {
          "@type": "Person",
          "name": "Rhys Williams",
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
      "image": "https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/images-logo-webp/public",
      "url": "https://jerrycanspirits.co.uk",
      "telephone": "+44 7521 220541",
      "email": "hello@jerrycanspirits.co.uk",
      "priceRange": "££",
      "description": "Veteran-owned British spirits company. Founded by Royal Corps of Signals veterans. Expedition Spiced Rum, produced at Spirit of Wales Distillery, Newport.",
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
      "description": "Veteran-owned British craft spirits - Engineered for reliability, designed for adventure. Expedition Ready.",
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
      "logo": "https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/images-logo-webp/public",
      "slogan": "Engineered for reliability, designed for adventure",
      "description": "Veteran-owned British craft spirits with authentic military heritage"
    },
  ];

  return (
    <>
      <ScrollToHash />
      <StructuredData data={structuredData} />
      <div>
        <HeroSection />

        {/* Social Proof Ticker */}
        <TickerStrip
          items={["17+ Years Service", "UK First Philosophy", "Small Batch Quality", "Armed Forces Covenant", "Veteran Owned", "Welsh Distilled"]}
          className="py-4 bg-jerry-green-900/80 border-y border-gold-500/20"
        />

        {/* Pre-Order Section - Primary CTA */}
        <ScrollReveal>
          <PreOrderSection />
        </ScrollReveal>

        {/* Press & Awards - social proof before storytelling */}
        <ScrollReveal>
          <PressAwards />
        </ScrollReveal>

        {/* Why Jerry Can - Value Proposition */}
        <ScrollReveal>
          <WhyJerryCan />
        </ScrollReveal>

        {/* Founder Story + Supporting Our Forces - brand identity, kept adjacent */}
        <ScrollReveal>
          <FounderStorySnippet />
        </ScrollReveal>
        <ScrollReveal>
          <SupportingOurForces />
        </ScrollReveal>

        {/* Expedition Log Map - community */}
        <HomepageExpeditionMap />

        {/* Field Manual Preview - content engagement */}
        <ScrollReveal>
          <FieldManualPreview />
        </ScrollReveal>

        {/* FAQ Section - objection handling before final CTA */}
        <HomepageFAQ />

        {/* Newsletter Signup */}
        <section id="newsletter-signup" className="py-20 border-t border-gold-500/10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Join the Expedition
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
              10% off your first order.
            </h2>
            <p className="text-parchment-300 mb-8">
              Sign up and we will send you a 10% discount code.
            </p>
            <NewsletterSignup />
          </div>
        </section>

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
                    We didn't set out to start a spirits company. Between us, we served 17 years in the Royal Corps of Signals. What we wanted was simple: a proper drink to share with mates - something with character, made by people who give a damn. When we couldn't find it, we decided to make it ourselves.
                  </p>
                  <p>
                    Working with <Link href="/friends/" className="text-gold-300 hover:text-gold-400 underline">Spirit of Wales Distillery</Link>, we blend Caribbean rum with Welsh brewery molasses and put it through their pot stills. The result? Vanilla and caramel upfront, warm spice through the middle, and a finish smooth enough to sip neat - but bold enough to hold its own in a cocktail.
                  </p>
                  <p>
                    Whether you're mixing drinks at home or just unwinding after a long week, this is rum that doesn't let you down. We built it that way on purpose.{' '}
                    <Link href="/shop/spiced-rum/" className="text-gold-300 hover:text-gold-400 underline underline-offset-2">
                      Find it in the shop.
                    </Link>
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
                    There's a reason we named ourselves after the jerry can. It wasn't designed to look good on a shelf. It was designed to work - in the desert, in the Arctic, wherever it was needed. That's the standard we hold ourselves to. Rum that does what it's supposed to do, every single time.{' '}
                    <Link href="/shop/" className="text-gold-300 hover:text-gold-400 underline underline-offset-2">
                      Browse the shop.
                    </Link>
                  </p>
                </div>
              </div>
              </ScrollReveal>
            </div>

            {/* Key Features Grid */}
            <div className="mt-12 grid md:grid-cols-4 gap-6">
              <ScrollReveal delay={0}>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">17+ Years Service</h3>
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

        {/* Trustpilot Reviews Section - Hidden until April 2026 launch */}
        {/* CSP is configured for Trustpilot, will activate automatically at launch */}
        {new Date() >= new Date('2026-04-06T00:00:00Z') && (
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
              <div className="max-w-2xl mx-auto">
                <TrustpilotWidget
                  templateId="56278e9abfbbba0bdcd568bc"
                  height="52px"
                  token="1b8d76a8-b743-471a-8f16-321500842e93"
                  theme="dark"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
