import ReactDOM from 'react-dom';
import HeroSection from "@/components/HeroSection";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import OrderSection from "@/components/OrderSection";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import SupportingOurForces from "@/components/SupportingOurForces";
import WhyJerryCan from "@/components/WhyJerryCan";
import HomepageFAQ from "@/components/HomepageFAQ";
import ScrollReveal from "@/components/ScrollReveal";
import PullQuoteStrip from "@/components/PullQuoteStrip";
import PressAwards from "@/components/PressAwards";
import MedalBar from "@/components/MedalBar";
import Link from 'next/link'
import type { Metadata } from 'next'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
import { BASE_URL } from '@/lib/jsonLd'

export const revalidate = 60


export const metadata: Metadata = {
  title: {
    absolute: "Jerry Can Spirits | British Spiced Rum",
  },
  description: "Two Royal Signals veterans, two IWSC medals in year one. Expedition Spiced Rum: real ingredients, small batches, no shortcuts. Now shipping.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/",
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Jerry Can Spirits | British Spiced Rum",
    description: "Two Royal Signals veterans, two IWSC medals in year one. Expedition Spiced Rum: real ingredients, small batches, no shortcuts. Now shipping.",
    url: "https://jerrycanspirits.co.uk/",
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: "Jerry Can Spirits | British Spiced Rum",
    description: "Two Royal Signals veterans, two IWSC medals in year one. Expedition Spiced Rum: real ingredients, small batches, no shortcuts. Now shipping.",
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

  // Structured data for SEO.
  //
  // The Organization and WebSite nodes that used to live here were byte-for-byte
  // duplicates of the ones the root layout already emits on every page, so this
  // page shipped two of each and a consumer had no way to know they described
  // one company. Both are now defined once in the layout; the home page adds
  // only what is specific to it. No LocalBusiness node: it asserts a physical
  // premises customers can visit, which a DTC brand does not have, and a street
  // address in structured data sits too close to implying place of production.
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Brand",
      "@id": `${BASE_URL}/#brand`,
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

        {/* Proof bar - the hero headline makes the two-medals claim; this
            states the fact once in full, judges' note included, linked to the
            IWSC listing. The only place on the page the medals are detailed. */}
        <MedalBar />

        {/* Pull-quote strip - instant social proof under the hero */}
        <PullQuoteStrip />

        {/* Founder story - story leads, builds belief */}
        <ScrollReveal>
          <FounderStorySnippet />
        </ScrollReveal>

        {/* Why Jerry Can - value proposition */}
        <ScrollReveal>
          <WhyJerryCan />
        </ScrollReveal>

        {/* Order Section - the buy ask, after belief is built */}
        <ScrollReveal>
          <OrderSection />
        </ScrollReveal>

        {/* Supporting our forces - pledge */}
        <ScrollReveal>
          <SupportingOurForces />
        </ScrollReveal>

        {/* Press & accreditations - reassurance tier, after the pledge. The
            Trustpilot proof lives in the pull-quote strip; the IWSC medals in
            the MedalBar. The expedition map and Field Manual preview that
            followed were homepage detours from the one CTA and moved off the
            page in the restructure (see docs/plans/2026-08-28). The Field
            Manual keeps its place in the nav; the map lives on at
            /expedition-log/. */}
        <ScrollReveal>
          <PressAwards />
        </ScrollReveal>

        {/* FAQ - objection handling before final CTA */}
        <HomepageFAQ />

        {/* SEO-Rich Content Section - kept for crawlers, lowest priority */}
        <section className="py-16 bg-jerry-green-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <ScrollReveal>
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Why We Started Making Rum
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    We didn't set out to start a spirits company. Between us, we served 17 years in the Royal Corps of Signals. What we wanted was simple: a proper drink to share with mates - something with character, made by people who give a damn. When we couldn't find it, we decided to make it ourselves.
                  </p>
                  <p>
                    Caribbean rum, macerated by our British partner distillery. The result? Vanilla and caramel upfront, warm spice through the middle, and a finish smooth enough to sip neat - but bold enough to hold its own in a cocktail.
                  </p>
                  <p>
                    Mixing drinks or unwinding after a long week, this is rum that doesn't let you down. We built it that way on purpose.{' '}
                    <Link href="/shop/spiced-rum/" className="text-gold-300 hover:text-gold-400 underline underline-offset-2">
                      Find it in the shop.
                    </Link>
                  </p>
                </div>
              </div>
              </ScrollReveal>

              <ScrollReveal delay={1}>
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <h2 className="text-3xl font-serif font-bold text-white mb-6">
                  Why We Do It This Way
                </h2>
                <div className="space-y-4 text-parchment-200 leading-relaxed">
                  <p>
                    We work with what's close to home where we can. Our rum is macerated by our British partner distillery, in small batches. It's not about slapping 'eco-friendly' on the label. It's just how we think things should be done.
                  </p>
                  <p>
                    We signed the Armed Forces Covenant because supporting veterans isn't a marketing angle for us - it's personal. 5% of profits goes to forces charities. We guarantee job interviews for veterans. It's baked into how we run the company, not bolted on afterwards.
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
                  <p className="text-parchment-300 text-sm">Real botanicals, British small batches</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Small Batch. Properly Made.</h3>
                  <p className="text-parchment-300 text-sm">Macerated by our British partner distillery. Every batch small enough to pay attention to.</p>
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

      </div>
    </>
  );
}
