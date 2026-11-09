import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'
import FirstPourSignup from '@/components/FirstPourSignup'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'

const TITLE = 'The Advance Party | First Call on Every Batch'
const DESCRIPTION = 'A free list from Jerry Can Spirits. Members hear when a new batch is ready, order before it goes on general sale, and are invited to taste it.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/advance-party/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://jerrycanspirits.co.uk/advance-party/',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: TITLE,
    description: DESCRIPTION,
    images: OG_IMAGE,
  },
}

export default function AdvancePartyPage() {
  return (
    <main>
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Breadcrumbs items={[{ label: 'The Advance Party' }]} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="The Advance Party"
            intro="The advance party goes ahead and secures the ground before the main body arrives. Here, it is the list that hears about each batch first and orders before anyone else."
          >
            The next batch goes to
            <br />
            <span className="text-gold-300">the Advance Party first.</span>
          </SectionHeading>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <div className="relative aspect-3/4 max-w-sm mx-auto md:mx-0 md:ml-auto">
                <div className="absolute inset-0 bg-linear-to-br from-jerry-green-800 to-jerry-green-900 border border-gold-500/30 rounded-lg shadow-2xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-gold-300 text-xs font-semibold uppercase tracking-widest mb-4">
                    Jerry Can Spirits
                  </div>
                  <div className="font-serif text-4xl text-white mb-3">
                    The Advance Party
                  </div>
                  <div className="w-12 h-0.5 bg-gold-500 mb-4" />
                  <div className="text-parchment-300 text-sm italic">
                    First call on every batch
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="max-w-md mx-auto md:mx-0">
                <h2 className="font-serif text-3xl text-white mb-4">
                  Put your name down.
                </h2>
                <p className="text-parchment-300 mb-8">
                  Free to join. No discount codes. One email when a batch opens to members, one when it goes on general sale, and quiet in between.
                </p>
                <FirstPourSignup list="advance-party" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <SectionHeading>
              What members get
            </SectionHeading>
            <ScrollRow
              ariaLabel="What Advance Party members get"
              cols="md:grid-cols-3"
              items={[
                <div key="first-call" className="h-full text-center">
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">
                    First call
                  </div>
                  <p className="text-parchment-300">
                    Each batch opens to members before it goes on general sale. A private link, a stated closing date, one bottle each.
                  </p>
                </div>,
                <div key="numbers" className="h-full text-center">
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">
                    The low numbers
                  </div>
                  <p className="text-parchment-300">
                    Every bottle carries its number. The lowest numbers in each batch are held for members and recorded against your order.
                  </p>
                </div>,
                <div key="tasting" className="h-full text-center">
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">
                    The tasting
                  </div>
                  <p className="text-parchment-300">
                    One members&apos; tasting for each batch, run by the founder, before the bottles ship.
                  </p>
                </div>,
              ]}
            />
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
