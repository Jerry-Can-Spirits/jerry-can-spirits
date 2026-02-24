import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'

const TrustpilotWidget = dynamic(() => import('@/components/TrustpilotWidget'), {
  loading: () => (
    <div className="h-[52px] bg-jerry-green-800/50 rounded-lg animate-pulse" />
  ),
})

export const metadata: Metadata = {
  title: "Jerry Can Spirits Reviews",
  description: "Read reviews of Jerry Can Spirits premium British spiced rum. See what customers say about our veteran-owned, small-batch craft rum.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/reviews/',
  },
  openGraph: {
    title: "Jerry Can Spirits Reviews",
    description: "Read reviews of Jerry Can Spirits premium British spiced rum. See what customers say about our veteran-owned, small-batch craft rum.",
  },
}

export default function ReviewsPage() {
  return (
    <main className="bg-jerry-green-900 text-parchment-100 min-h-screen">
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
              <h2 className="font-serif text-2xl font-bold text-parchment-50 mb-2">
                Trustpilot Reviews
              </h2>
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
              <h2 className="font-serif text-2xl font-bold text-parchment-50 mb-2">
                Google Reviews
              </h2>
              <a
                href="https://g.page/r/CdkZacM6VKi-EAE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold-300 hover:text-gold-400 transition-colors underline"
              >
                View on Google
              </a>
            </div>
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <svg className="w-8 h-8 text-gold-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-parchment-300 text-lg">Google Reviews</span>
              </div>
              <p className="text-parchment-400 mb-6">
                We launch in April 2026 — Google reviews coming soon.
              </p>
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
              <h2 className="font-serif text-2xl font-bold text-parchment-50 mb-2">
                Yell Reviews
              </h2>
              <a
                href="https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold-300 hover:text-gold-400 transition-colors underline"
              >
                View on Yell
              </a>
            </div>
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#003580" />
                  <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">Y</text>
                </svg>
                <span className="text-parchment-300 text-lg">Yell Reviews</span>
              </div>
              <p className="text-parchment-400 mb-6">
                We launch in April 2026 — Yell reviews coming soon.
              </p>
              <a
                href="https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/#reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#003580] hover:bg-[#002a66] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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
                className="inline-flex items-center gap-2 bg-[#003580] hover:bg-[#002a66] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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

      {/* Back to Shop */}
      <section className="max-w-4xl mx-auto px-6 pb-16 text-center">
        <Link
          href="/shop/"
          className="text-gold-300 hover:text-gold-400 transition-colors underline"
        >
          Browse our collection
        </Link>
      </section>
    </main>
  )
}
