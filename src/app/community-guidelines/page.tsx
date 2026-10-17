import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'
import SectionHeading from '@/components/SectionHeading'
import { baseOpenGraph } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Community Guidelines',
  description: 'These guidelines cover what you share with us.',
  url: 'https://jerrycanspirits.co.uk/community-guidelines/',
  publisher: ORG_REF,
  inLanguage: 'en-GB',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
  },
}

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'These guidelines cover what you share with us.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/community-guidelines/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Community Guidelines | Jerry Can Spirits®',
    description: 'These guidelines cover what you share with us.',
    url: 'https://jerrycanspirits.co.uk/community-guidelines/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CommunityGuidelines() {
  const lastUpdated = '17 October 2026'

  return (
    <>
      <StructuredData data={webPageSchema} id="community-guidelines-webpage-schema" />
      <main>
        <section className="band-dark pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading as="h1" eyebrow="Legal">
              Community Guidelines
            </SectionHeading>
            <p className="text-parchment-300 text-sm text-center">
              Last updated: {lastUpdated}
            </p>
          </div>
        </section>

        <section className="band-light py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <p className="text-white leading-relaxed">
                  These guidelines cover what you share with us. They apply on our Instagram, Facebook, Threads, LinkedIn and YouTube accounts, in comments and messages, to posts that tag or mention us, to entries on the Expedition Log, and to any review we show or quote on this site.
                </p>
              </section>

              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                  Alcohol is for adults
                </h2>
                <p className="text-white">
                  You must be 18 or over to post to us or join the Expedition Log.
                </p>
              </section>

              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                  What has no place here
                </h2>
                <p className="text-white mb-4">
                  Do not post anything that:
                </p>
                <ul className="list-disc list-inside text-white space-y-2">
                  <li>shows anyone under 18, or anyone who looks under 25 drinking or in a leading role</li>
                  <li>encourages drinking too much or too fast, or drinking by anyone under 18</li>
                  <li>mocks or pressures people who do not drink</li>
                  <li>links drinking with driving, machinery, water, heights or any other activity where alcohol is unsafe</li>
                  <li>says alcohol improves health, mood, confidence, performance, popularity or sex appeal</li>
                  <li>praises strength or drunkenness</li>
                  <li>shows or encourages drugs, violence or other illegal acts</li>
                  <li>uses photos, video, music or words that are not yours without permission</li>
                  <li>is abusive, hateful, threatening or discriminatory, or shares someone&apos;s private details</li>
                  <li>is spam, a scam, or advertising for another business</li>
                  <li>pretends to be us, a member of our team, or anyone else</li>
                  <li>disrespects the armed forces community, veterans, the bereaved or Remembrance</li>
                  <li>claims service, rank or awards that are not yours, or misuses service insignia or medals</li>
                </ul>
              </section>
            </div>
          </div>
        </section>

        <section className="band-dark py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                  What we do
                </h2>
                <p className="text-white mb-4">
                  We hide or remove posts that break these guidelines, and may block and report the account.
                </p>
                <p className="text-white mb-4">
                  We do not remove a post because it criticises us.
                </p>
                <p className="text-white mb-4">
                  We do not like, reply to or reshare a post that breaks these guidelines.
                </p>
                <p className="text-white mb-4">
                  Reviews on Trustpilot and Google belong to those platforms. We cannot edit or delete them, but we report any that break the platform&apos;s rules.
                </p>
                <p className="text-white">
                  Expedition Log entries appear as soon as they are submitted. We remove any entry that breaks these guidelines or is not yours to make. You can ask us to remove your own entry at any time.
                </p>
              </section>

              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                  Resharing your posts
                </h2>
                <p className="text-white">
                  We reshare a post only with the owner&apos;s permission, and we credit them. We never reshare a post that shows anyone who looks under 25.
                </p>
              </section>

              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                  Reporting a post
                </h2>
                <p className="text-white">
                  If you see a post on our accounts that breaks these guidelines, message us on the platform or email{' '}
                  <a href="mailto:hello@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                    hello@jerrycanspirits.co.uk
                  </a>{' '}
                  with a link to it.
                </p>
              </section>

              <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                  Drinking well
                </h2>
                <p className="text-white">
                  For facts about alcohol and health, visit Drinkaware at{' '}
                  <a href="https://www.drinkaware.co.uk" target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:text-gold-200 underline">
                    drinkaware.co.uk
                  </a>
                  .
                </p>
              </section>
            </div>

            <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
              <p className="text-parchment-300 text-sm">
                <strong className="text-gold-300">
                  These guidelines were last updated on {lastUpdated}.
                </strong>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
