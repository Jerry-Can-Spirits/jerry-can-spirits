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

        {/* The two prose cards that closed this page went on 24 Sep 2026.
            Checked against every page that could have taken them: the origin,
            the production line and the tasting notes were all already on
            /shop/spiced-rum/ in fuller form, the jerry can name is in the Why
            Jerry Can section a few screens up and again on /about/story/, and
            the close-to-home sourcing is on /ethos/. The one thing the site
            said nowhere else, the Armed Forces Covenant signature, moved to
            /ethos/ rather than being lost. */}

      </div>
    </>
  );
}
