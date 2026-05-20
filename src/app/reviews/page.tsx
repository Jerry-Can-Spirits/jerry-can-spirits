import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'
import { baseOpenGraph } from '@/lib/og'
import { safeJsonLd } from '@/lib/jsonLd'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRating } from '@/lib/ratings-cache'
import { RatingRow } from '@/components/RatingRow'

const CF_IMG = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

const TrustpilotWidget = dynamic(() => import('@/components/TrustpilotWidget'), {
  loading: () => (
    <div className="h-[52px] bg-jerry-green-800/50 rounded-lg animate-pulse" />
  ),
})

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Customer Reviews | Trustpilot, Google, Yell & Trust A Veteran",
  description: "Reviews of Expedition Spiced Rum on Trustpilot, Google, Yell, and Trust A Veteran. Veteran-owned British spiced rum, no shortcuts.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/reviews/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Jerry Can Spirits Reviews | Trustpilot, Google, Yell & Trust A Veteran",
    description: "Reviews of Expedition Spiced Rum on Trustpilot, Google, Yell, and Trust A Veteran. Veteran-owned British spiced rum, no shortcuts.",
    url: 'https://jerrycanspirits.co.uk/reviews/',
  },
}

export default async function ReviewsPage() {
  const { env } = await getCloudflareContext({ async: true })
  const kv = env.SITE_OPS as KVNamespace
  const google = await getRating(kv, 'google')

  const aggregateRating = google
    ? {
        '@type': 'AggregateRating',
        'ratingValue': google.rating.toFixed(1),
        'reviewCount': google.count.toString(),
        'bestRating': '5',
        'worstRating': '1',
        'itemReviewed': {
          '@type': 'Product',
          'name': 'Expedition Spiced Rum',
          'url': 'https://jerrycanspirits.co.uk/shop/product/jerry-can-spirits-expedition-spiced-rum/',
        },
      }
    : undefined

  return (
    <main className="bg-jerry-green-900 text-parchment-100 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Jerry Can Spirits Reviews',
          description: 'Customer reviews of Jerry Can Spirits Expedition Spiced Rum on Trustpilot, Google and Yell.',
          url: 'https://jerrycanspirits.co.uk/reviews/',
          isPartOf: {
            '@type': 'WebSite',
            name: 'Jerry Can Spirits',
            url: 'https://jerrycanspirits.co.uk',
          },
          about: {
            '@type': 'Organization',
            name: 'Jerry Can Spirits',
            url: 'https://jerrycanspirits.co.uk',
            sameAs: [
              'https://www.trustpilot.com/review/jerrycanspirits.co.uk',
              'https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/',
              'https://www.trustaveteran.com/',
            ],
            ...(aggregateRating ? { aggregateRating } : {}),
          },
        }) }}
      />
      <Breadcrumbs items={[{ label: 'Reviews' }]} />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        <ScrollReveal>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-parchment-50 mb-4">
            Jerry Can Spirits Reviews
          </h1>
          <p className="text-lg text-parchment-300 max-w-2xl mx-auto">
            What people say after they&apos;ve poured it. Reviews left on Trustpilot, Google, Yell, and Trust A Veteran.
          </p>
        </ScrollReveal>
      </section>

      {/* Trustpilot Section */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <ScrollReveal>
          <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <a
                href="https://www.trustpilot.com/review/jerrycanspirits.co.uk"
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                <Image
                  src={`${CF_IMG}/004c8ba7-42d4-48c8-c82c-fe715eb9cc00/public`}
                  alt="Trustpilot"
                  width={160}
                  height={40}
                  className="mx-auto mb-3 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://www.trustpilot.com/review/jerrycanspirits.co.uk"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-sm text-gold-300 hover:text-gold-400 transition-colors underline"
              >
                View all on Trustpilot
              </a>
            </div>
            {/* Review Collector widget */}
            <TrustpilotWidget
              templateId="56278e9abfbbba0bdcd568bc"
              height="52px"
              theme="dark"
              stars="1,2,3,4,5"
              token="9323db11-b776-4e7e-b956-0b8762a3cf63"
            />
          </div>
        </ScrollReveal>
      </section>

      {/* Google Reviews Section */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <ScrollReveal>
          <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <a
                href="https://g.page/r/CdkZacM6VKi-EAE"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={`${CF_IMG}/a5cccbf5-1d09-43d6-4449-5218da645400/public`}
                  alt="Google Reviews"
                  width={140}
                  height={35}
                  className="mx-auto mb-3 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://g.page/r/CdkZacM6VKi-EAE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold-300 hover:text-gold-400 transition-colors underline"
              >
                View on Google
              </a>
            </div>
            {google && (
              <RatingRow rating={google.rating} count={google.count} platform="google" />
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* Yell Reviews Section */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <ScrollReveal>
          <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <a
                href="https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={`${CF_IMG}/9fb15cc3-4b8a-483b-f77b-b73002d59700/public`}
                  alt="Yell"
                  width={120}
                  height={35}
                  className="mx-auto mb-3 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold-300 hover:text-gold-400 transition-colors underline"
              >
                View on Yell
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Trust A Veteran Reviews Section */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <ScrollReveal>
          <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <a
                href="https://www.trustaveteran.com/"
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                <Image
                  src="/images/partners/trust-a-veteran.png"
                  alt="Trust A Veteran"
                  width={160}
                  height={40}
                  className="mx-auto mb-3 hover:opacity-80 transition-opacity"
                />
              </a>
              <a
                href="https://www.trustaveteran.com/"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-sm text-gold-300 hover:text-gold-400 transition-colors underline"
              >
                View on Trust A Veteran
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Leave a Review CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <ScrollReveal>
          <div className="bg-gradient-to-r from-jerry-green-800 to-jerry-green-800/60 border border-gold-500/30 rounded-xl p-8 text-center">
            <h2 className="font-serif text-2xl font-bold text-parchment-50 mb-3">
              Tried Our Rum?
            </h2>
            <p className="text-parchment-300 mb-6 max-w-lg mx-auto">
              Your honest feedback helps other customers find us. Leave a review on the platform of your choice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://www.trustpilot.com/evaluate/jerrycanspirits.co.uk"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#00b67a] hover:bg-[#009567] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Review on Trustpilot
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://g.page/r/CdkZacM6VKi-EAI/review"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-jerry-green-900 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Review on Google
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/#reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FED900] hover:bg-[#CAB010] text-jerry-green-900 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Review on Yell
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://www.trustaveteran.com/"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center gap-2 bg-jerry-green-800/60 hover:bg-jerry-green-800 text-gold-300 font-semibold px-6 py-3 rounded-lg border border-gold-500/30 transition-colors"
              >
                Review on Trust A Veteran
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Internal Links */}
      <section className="max-w-4xl mx-auto px-6 pb-16 text-center flex items-center justify-center gap-6">
        <Link
          href="/shop/"
          className="text-gold-300 hover:text-gold-400 transition-colors underline"
        >
          Browse our collection
        </Link>
        <span className="text-gold-500/30">|</span>
        <Link
          href="/about/story/"
          className="text-gold-300 hover:text-gold-400 transition-colors underline"
        >
          Our story
        </Link>
      </section>
    </main>
  )
}
