import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'
const CF_IMG = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

const CF_IMG = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

const TrustpilotWidget = dynamic(() => import('@/components/TrustpilotWidget'), {
  loading: () => (
    <div className="h-[52px] bg-jerry-green-800/50 rounded-lg animate-pulse" />
  ),
})

export const metadata: Metadata = {
  title: "Jerry Can Spirits Reviews | Trustpilot, Google & Yell",
  description: "Read customer reviews of Jerry Can Spirits premium British spiced rum on Trustpilot, Google and Yell. See what people say about our veteran-owned, small-batch craft rum.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/reviews/',
  },
  openGraph: {
    title: "Jerry Can Spirits Reviews | Trustpilot, Google & Yell",
    description: "Read customer reviews of Jerry Can Spirits premium British spiced rum on Trustpilot, Google and Yell. See what people say about our veteran-owned, small-batch craft rum.",
  },
}

export default function ReviewsPage() {
  return (
    <main className="bg-jerry-green-900 text-parchment-100 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Jerry Can Spirits Reviews',
          description: 'Customer reviews of Jerry Can Spirits premium British spiced rum on Trustpilot, Google and Yell.',
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
              'https://uk.trustpilot.com/review/jerrycanspirits.co.uk',
              'https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/',
            ],
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
            Don&apos;t just take our word for it. Here&apos;s what people are saying about our premium British spiced rum.
          </p>
        </ScrollReveal>
      </section>

      {/* Trustpilot Section */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <ScrollReveal>
          <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <a
                href="https://uk.trustpilot.com/review/jerrycanspirits.co.uk"
                target="_blank"
                rel="noopener noreferrer"
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
                href="https://uk.trustpilot.com/review/jerrycanspirits.co.uk"
                target="_blank"
                rel="noopener noreferrer"
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
            <div className="text-center py-6">
              <a
                href="https://g.page/r/CdkZacM6VKi-EAI/review"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-jerry-green-900 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Leave a Google Review
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
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
            <div className="text-center py-6">
              <a
                href="https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/#reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FED900] hover:bg-[#CAB010] text-jerry-green-900 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Leave a Yell Review
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
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
              Your honest feedback helps fellow adventurers discover Jerry Can Spirits. Leave a review on the platform of your choice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://uk.trustpilot.com/evaluate/jerrycanspirits.co.uk"
                target="_blank"
                rel="noopener noreferrer"
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
