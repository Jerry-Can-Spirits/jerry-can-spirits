import type { Metadata } from 'next'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: "Sustainability & Recycling",
  description: "How Jerry Can Spirits approaches sustainability. Local sourcing, recycling guidance, and our commitment to reducing environmental impact.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/sustainability/',
  },
  openGraph: {
    title: 'Sustainability & Recycling | Jerry Can Spirits®',
    description: 'How Jerry Can Spirits approaches sustainability. Local sourcing, recycling guidance, and our commitment to reducing environmental impact.',
    url: 'https://jerrycanspirits.co.uk/sustainability/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Sustainability() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Sustainability' },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Sustainability
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            Made to Last,
            <br />
            <span className="text-gold-300">Built to Return</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            We&apos;re not perfect, but we&apos;re trying to do things properly. Here&apos;s how we approach sustainability and what you can do with your bottle when it&apos;s empty.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Recycling Section */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              Recycling Your Bottle
            </h2>

            <div className="space-y-6 text-parchment-300">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-gold-400 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">The Glass Bottle</h3>
                  <p>Our bottles are made from standard glass and can be recycled in your household glass recycling bin or at a local bottle bank. Give it a quick rinse first.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-gold-400 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">The Cap</h3>
                  <p>Our cap is made from natural wood with a micro agglomerate cork seal — both natural, renewable materials. The cork can be composted, and the wooden top can go in your garden waste or be repurposed.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-gold-400 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">The Label</h3>
                  <p>You don&apos;t need to remove the label before recycling — modern recycling facilities handle this during processing.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Sourcing */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              Local Sourcing
            </h2>

            <div className="space-y-4 text-parchment-300">
              <p>
                We work with what&apos;s close to home where we can. Our rum is distilled in Wales using Welsh water, and the molasses comes partly from a local brewery&apos;s beer production — good ingredients that would otherwise go to waste.
              </p>
              <p>
                It&apos;s not about slapping &quot;eco-friendly&quot; on the label. It&apos;s just how we think things should be done.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-jerry-green-800/60 rounded-lg p-4">
                  <h3 className="text-gold-300 font-semibold mb-2">Welsh Water</h3>
                  <p className="text-sm">Pure water from Wales, used in our distillation process.</p>
                </div>
                <div className="bg-jerry-green-800/60 rounded-lg p-4">
                  <h3 className="text-gold-300 font-semibold mb-2">Brewery Molasses</h3>
                  <p className="text-sm">Sourced from local Welsh brewery production — reducing waste.</p>
                </div>
                <div className="bg-jerry-green-800/60 rounded-lg p-4">
                  <h3 className="text-gold-300 font-semibold mb-2">UK Distillation</h3>
                  <p className="text-sm">Distilled at Spirit of Wales Distillery in Gwent.</p>
                </div>
                <div className="bg-jerry-green-800/60 rounded-lg p-4">
                  <h3 className="text-gold-300 font-semibold mb-2">Caribbean Rum Base</h3>
                  <p className="text-sm">Some things have to travel — we use quality Caribbean rum as our foundation.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Future Plans */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              What We&apos;re Working On
            </h2>

            <div className="space-y-4 text-parchment-300">
              <p>
                We&apos;re a small company still finding our feet, but here&apos;s what we&apos;re exploring:
              </p>

              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong className="text-gold-300">Refill Programme:</strong> We&apos;re looking into a bottle return and refill scheme for future batches.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong className="text-gold-300">Packaging Reduction:</strong> Minimising unnecessary packaging without compromising product protection.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong className="text-gold-300">Carbon Footprint:</strong> Understanding and reducing our environmental impact as we grow.</span>
                </li>
              </ul>

              <p className="mt-6 text-sm text-parchment-400">
                Got suggestions? We&apos;re genuinely interested. Drop us a line at{' '}
                <a href="mailto:hello@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-400 underline">
                  hello@jerrycanspirits.co.uk
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ethos"
              className="inline-flex items-center justify-center space-x-2 bg-jerry-green-800 hover:bg-jerry-green-700 text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-gold-500/30 hover:border-gold-500/60 transition-all duration-300"
            >
              <span>Our Ethos</span>
            </Link>
            <Link
              href="/ingredients"
              className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300"
            >
              <span>View Ingredients</span>
            </Link>
          </div>
        </section>

      </div>

      <BackToTop />
    </main>
  )
}
