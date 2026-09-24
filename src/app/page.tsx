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
import HomepageProductGrid from "@/components/HomepageProductGrid";
import RumServesTeaser from "@/components/RumServesTeaser";
import Link from 'next/link'
import type { Metadata } from 'next'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
import { BASE_URL } from '@/lib/jsonLd'

// Hourly, like the shop pages. The grid below fetches every product, and the
// products/update webhook revalidates this path the moment a price or
// availability changes, so a shorter window bought nothing but Storefront
// calls.
export const revalidate = 3600


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

        {/* Proof bar, directly under the hero whose headline makes the
            two-medals claim: states the fact once in full, judges' note
            included, linked to the IWSC listing, so the prices in the rows
            below land with the proof already seen. The only place on the
            page the medals are detailed. */}
        <MedalBar />

        {/* Every purchasable product with its price, so a first visit sees
            the whole range and what a first order can start at without
            leaving the page (restructure, 24 Sep 2026). */}
        <HomepageProductGrid />

        {/* Reviews, straight after the ask: the pull-quote strip and the
            live TrustScore. Proof sits next to the prices, not after the
            story (funnel order, 24 Sep 2026). */}
        <PullQuoteStrip />

        {/* Why Jerry Can - value proposition */}
        <ScrollReveal>
          <WhyJerryCan />
        </ScrollReveal>

        {/* Founder story - builds belief */}
        <ScrollReveal>
          <FounderStorySnippet />
        </ScrollReveal>

        {/* Supporting our forces - pledge */}
        <ScrollReveal>
          <SupportingOurForces />
        </ScrollReveal>

        {/* Press & accreditations - reassurance tier, after the pledge. The
            IWSC medals live in the MedalBar. */}
        <ScrollReveal>
          <PressAwards />
        </ScrollReveal>

        {/* Three serves built on the rum, linking to the Field Manual. The
            library preview and the expedition map were removed on 28 Aug 2026
            as detours from the one CTA (docs/plans/2026-08-28); this narrower
            version was reinstated on 24 Sep 2026 because a visitor this far
            down is asking what they would do with the bottle. The map lives
            on at /expedition-log/. */}
        <ScrollReveal>
          <RumServesTeaser />
        </ScrollReveal>

        {/* FAQ - objection handling before the final CTA */}
        <HomepageFAQ />

        {/* The closing ask: the numbered batch and the two ways to buy it,
            after every objection has been handled. It sat between the story
            and the pledge as a second buy block until 24 Sep 2026; the shop
            rows now carry the first ask, so this is the last word. */}
        <ScrollReveal>
          <OrderSection />
        </ScrollReveal>

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

            {/* The four feature tiles that followed these two cards went on
                24 Sep 2026: each restated a Why Jerry Can pillar or the
                pledge, a screen higher, in fewer words. */}
          </div>
        </section>

      </div>
    </>
  );
}
