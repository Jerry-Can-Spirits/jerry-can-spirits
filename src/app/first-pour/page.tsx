import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'
import FirstPourSignup from '@/components/FirstPourSignup'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'First Pour | The Jerry Can Spirits Companion Book',
  description: 'A free companion book from Jerry Can Spirits. How the rum is built, how to drink it properly, and the first cocktails to try. Enter your email and we will send it over.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/first-pour/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'First Pour | The Jerry Can Spirits Companion Book',
    description: 'A free companion book from Jerry Can Spirits. How the rum is built, how to drink it properly, and the first cocktails to try.',
    url: 'https://jerrycanspirits.co.uk/first-pour/',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'First Pour | The Jerry Can Spirits Companion Book',
    description: 'A free companion book from Jerry Can Spirits. How the rum is built, how to drink it properly, and the first cocktails to try.',
    images: OG_IMAGE,
  },
}

export default function FirstPourPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs items={[{ label: 'First Pour' }]} />
      </div>

      {/* Hero */}
      <section className="relative py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              The companion book
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            Most people have not found
            <br />
            <span className="text-gold-300">their spiced rum yet.</span>
          </h1>
          <p className="text-parchment-200 text-lg max-w-2xl mx-auto">
            First Pour is the short companion to ours. How it is built, how to drink it, and the first cocktails worth your time.
          </p>
        </div>
      </section>

      {/* Cover + signup */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Cover placeholder */}
            <ScrollReveal>
              <div className="relative aspect-[3/4] max-w-sm mx-auto md:mx-0 md:ml-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 border border-gold-500/30 rounded-lg shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-gold-300 text-xs font-semibold uppercase tracking-widest mb-4">
                    Jerry Can Spirits
                  </div>
                  <div className="font-serif text-4xl text-white mb-3">
                    First Pour
                  </div>
                  <div className="w-12 h-0.5 bg-gold-500 mb-4" />
                  <div className="text-parchment-300 text-sm italic">
                    A companion to Expedition Spiced
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Signup */}
            <ScrollReveal>
              <div className="max-w-md mx-auto md:mx-0">
                <h2 className="font-serif text-3xl text-white mb-4">
                  Enter your email. We send the book.
                </h2>
                <p className="text-parchment-300 mb-8">
                  No spam. No pressure. The occasional email when we have something worth saying.
                </p>
                <FirstPourSignup />
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* What is inside */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="font-serif text-3xl text-white text-center mb-12">
              What is inside
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">
                  How it is built
                </div>
                <p className="text-parchment-300">
                  The base, the botanicals, and the maceration. No artificial flavouring. No shortcuts.
                </p>
              </div>
              <div className="text-center">
                <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">
                  How to drink it
                </div>
                <p className="text-parchment-300">
                  Neat. With one ice cube. The serve we built it for, and the ones to avoid.
                </p>
              </div>
              <div className="text-center">
                <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">
                  First cocktails
                </div>
                <p className="text-parchment-300">
                  A short list of cocktails worth your first bottle. Quiet drinks, properly built.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
