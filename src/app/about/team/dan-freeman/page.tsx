import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import FAQAccordion, { type FAQAccordionItem } from '@/components/FAQAccordion'
import { OG_IMAGE } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'

// Person schema for founder profile
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dan Freeman',
  jobTitle: 'Founder & Director',
  url: 'https://jerrycanspirits.co.uk/about/team/dan-freeman/',
  image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/1a3a3fdd-fdd8-482c-2088-660df51c6c00/public',
  description: 'Former Royal Signals Corporal with 12 years of service, founder of Jerry Can Spirits.',
  worksFor: ORG_REF,
  alumniOf: {
    '@type': 'Organization',
    name: 'Royal Corps of Signals, British Army',
  },
  knowsAbout: ['Rum', 'Distillation', 'Spirits', 'Military Service'],
}

export const metadata: Metadata = {
  title: 'Dan Freeman - Founder & Director',
  description: 'Meet Dan Freeman, founder of Jerry Can Spirits. Former Royal Signals Corporal with 12 years of service who decided to have a go at building a spirits company.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/dan-freeman/',
  },
  openGraph: {
    title: 'Dan Freeman - Founder & Director | Jerry Can Spirits®',
    description: 'Former Royal Signals Corporal with 12 years of service who decided to have a go at building a spirits company.',
    url: 'https://jerrycanspirits.co.uk/about/team/dan-freeman',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'profile',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Dan Freeman - Founder & Director | Jerry Can Spirits®',
    description: 'Former Royal Signals Corporal with 12 years of service who decided to have a go at building a spirits company.',
    images: OG_IMAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Ask Dan. His answers, given 26 Sep 2026, in his words: the edits are
// punctuation, one "SKUs" to "products", and "the Captain Morgan phase" to
// "the supermarket spiced rum phase" so no competitor is named, which the
// voice rules ask for. It sits in the column beside his facts, where a single
// panel left the band mostly empty.
const askDan: { group: string; items: FAQAccordionItem[] }[] = [
  {
    group: 'The story',
    items: [
      {
        question: 'What was the hardest transition from military life to civilian life?',
        answer: 'The costs of everything going up took a little getting used to. The army provides highly subsidised housing, so paying full whack was and still is a shock to the system.',
      },
      {
        question: 'What did you get wrong in the first year?',
        answer: 'Loads. The main one was not accounting for a marketing budget at all when we first raised the initial capital.',
      },
      {
        question: 'Is there a moment when it stopped feeling like a hobby?',
        answer: 'It still feels a little like a side hustle at the moment. We want to scale and grow so this becomes our full-time work, but it takes time.',
      },
    ],
  },
  {
    group: 'The why',
    items: [
      {
        question: 'What does "pride in your kit" mean to you?',
        answer: 'It is made to a standard I accept. We are not driven by profit to the point of lowering our standards to allow compromise in our drinks.',
      },
      {
        question: 'Who do you make the rum for?',
        answer: 'People who have already been through the supermarket spiced rum phase. They have tried a few, they want something with character, made by people rather than corporations, and they want something that tastes really good.',
      },
    ],
  },
  {
    group: 'The drinks',
    items: [
      {
        question: 'How do you take your spirits?',
        answer: 'All of the above. Depends on the situation and the time.',
      },
      {
        question: 'What is your go-to serve?',
        answer: (
          <>
            At home, a <Link href="/field-manual/cocktails/rum-and-coke/" className="text-gold-300 hover:text-gold-400 underline">rum and cola</Link>, loads of ice, ideally with Franklin &amp; Sons cola. Out, cocktails are a staple for me.
          </>
        ),
      },
      {
        question: 'Desert island bottle, any spirit?',
        answer: 'I would be daft if I did not say Expedition Spiced Rum. Got to back ourselves.',
      },
      {
        question: 'What is in your bar at home?',
        answer: 'I love tiki culture, so lots of different rums: aged, spiced, dark and light. I always have sugar syrup, grenadine and plenty of juice in the fridge.',
      },
      {
        question: 'Which cocktail should a beginner try first?',
        answer: (
          <>
            An <Link href="/field-manual/cocktails/old-fashioned/" className="text-gold-300 hover:text-gold-400 underline">Old Fashioned</Link> or similar. Sugar, bitters, spirit. Difficult to go too far wrong, and you get to really taste what the spirit is about.
          </>
        ),
      },
      {
        question: 'Is spiced rum only for mixing?',
        answer: 'Spiced rum is such a varied spirit. Some are just for mixing, undoubtedly, but some make amazing spirit-first drinks, or work really well in an Old Fashioned. There are thousands out there. It is all about finding the one that works for you.',
      },
    ],
  },
  {
    group: 'The person',
    items: [
      {
        question: 'What does a normal working day look like now?',
        answer: 'I work a day job to fund Jerry Can Spirits. I finish, come home, make dinner and feed the dogs, then spend around two hours working through emails, making the decisions that come out of them, and working on the website behind the scenes.',
      },
      {
        question: 'What is in your workflow right now?',
        answer: 'Budgeting for Batch 2, getting ideas ready for new products, and starting ideas for the Christmas period.',
      },
      {
        question: 'Best piece of advice you were ever given?',
        answer: 'Never ask anybody to do something you are not prepared to do yourself.',
      },
      {
        question: 'One piece of advice for a veteran thinking about starting a business?',
        answer: 'At some point you have to stop planning and thinking and just go for it. It is hard work, but it is really enjoyable.',
      },
    ],
  },
]

export default function DanFreemanPage() {
  return (
    <main>
      <StructuredData data={personSchema} id="dan-freeman-person-schema" />

      {/* Who he is: header, photo, quick facts and where the story starts. */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about/story' },
              { label: 'Team', href: '/about/team' },
              { label: 'Dan Freeman' },
            ]}
            className="mb-8"
          />

          {/* Back Button */}
          <Link
            href="/about/team/"
            className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors mb-8 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Team</span>
          </Link>

          <SectionHeading as="h1" eyebrow="Founder & Director" intro={<span className="text-gold-400 font-semibold">Former Royal Signals Corporal</span>}>
            Dan Freeman
          </SectionHeading>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Photo & Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Photo */}
              <div className="relative aspect-3/4 rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/1a3a3fdd-fdd8-482c-2088-660df51c6c00/public"
                  alt="Dan Freeman - Founder & Director of Jerry Can Spirits"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>

              {/* Quick Facts */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-4 pb-2 border-b border-gold-500/20">
                  Quick Facts
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Role</p>
                    <p className="text-parchment-200">Founder & Director</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Service</p>
                    <p className="text-parchment-200">Royal Signals</p>
                    <p className="text-parchment-300 text-xs">2012 - 2024 (12 years)</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Rank</p>
                    <p className="text-parchment-200">Corporal</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Deployments</p>
                    <p className="text-parchment-200">Falkland Islands, Afghanistan, Estonia</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Qualifications</p>
                    <p className="text-parchment-200">Essentials in Distilling (CIBD)</p>
                    <p className="text-parchment-300 text-xs">Associate Member</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Favourite Spirit</p>
                    <p className="text-parchment-200">
                      <Link href="/field-manual/ingredients/jerry-can-spirits-expedition-spiced-rum/" className="hover:text-gold-300 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Expedition Spiced Rum</Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Signature Cocktail</p>
                    <p className="text-parchment-200">
                      <Link href="/field-manual/cocktails/zombie/" className="hover:text-gold-300 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Zombie</Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Fun Fact */}
              <div className="bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-1">
                    <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold text-sm mb-1">Did You Know?</p>
                    <p className="text-parchment-300 text-sm">
                      Since leaving the forces, Dan hasn't shaved his beard once and has no intention of starting now.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - where the story starts. Two panels here, not
                one: the photo, the facts and the fun fact make the left
                column tall, and a single panel beside them left most of the
                band empty (Dan, 26 Sep 2026). */}
            <div className="lg:col-span-2">
              <div className="prose prose-invert max-w-none space-y-6">
                {/* Military Background */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Military Service
                  </h2>
                  <p className="text-parchment-200 leading-relaxed">
                    Dan served in the Royal Signals for 12 years (2012-2024), working in communications and information systems. He deployed to the Falklands, Afghanistan, and Estonia, with exercises across Europe and the US. Nothing heroic. Just the usual soldiering.
                  </p>
                </div>

                {/* Ask Dan: fills the column beside the facts. Closed by
                    default, so fifteen answers take the space of a short list
                    and open one at a time. */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ask Dan
                  </h2>
                  <div className="space-y-6">
                    {askDan.map((section) => (
                      <div key={section.group}>
                        <p className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-3">{section.group}</p>
                        <FAQAccordion items={section.items} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The rest of the story */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The story">Behind Dan</SectionHeading>

          <div className="prose prose-invert max-w-none space-y-6">
            {/* The Journey */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                The Journey to Jerry Can Spirits
              </h2>
              <p className="text-parchment-200 leading-relaxed mb-4">
                The idea of making rum had been coming up for years, one of those conversations that kept happening whenever Dan and <Link href="/about/team/rhys-williams/" className="text-gold-300 hover:text-gold-400 underline">Rhys</Link> got together. In July 2025, Dan decided to stop just talking about it and actually have a go. Having tried well over 100 different rums and genuinely loving the stuff, it felt like the right time to create <Link href="/shop/product/jerry-can-spirits-expedition-spiced-rum/" className="text-gold-300 hover:text-gold-400 underline">something worth drinking</Link>.
              </p>
              <p className="text-parchment-200 leading-relaxed">
                Since then, it&apos;s been a lot of learning: getting the Essentials in Distilling qualification from the Chartered Institute of Brewers and Distillers, sorting out the personal alcohol licence, navigating HMRC for AWRS approval. The usual stuff you have to figure out when you&apos;re starting from scratch. Read more about <Link href="/about/story/" className="text-gold-300 hover:text-gold-400 underline">how we got here</Link>.
              </p>
            </div>

            {/* Role & Expertise */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                Role at Jerry Can Spirits
              </h2>
              <p className="text-parchment-200 leading-relaxed mb-4">
                Since leaving the forces, Dan&apos;s been doing a bit of everything: operations, finance, legal compliance, building the website, SEO, product development. When you&apos;re a small outfit, you end up wearing a lot of hats.
              </p>
              <p className="text-parchment-200 leading-relaxed">
                The military taught him to pay attention to details and plan things properly, which comes in handy when you&apos;re trying to build something from nothing. His approach is pretty simple: make something you&apos;re proud of, and don&apos;t cut corners.
              </p>
            </div>

            {/* Personal Quote */}
            <div className="bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <svg className="w-8 h-8 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <blockquote className="flex-1">
                  <p className="text-xl text-parchment-100 italic leading-relaxed mb-4">
                    "Jerry Can Spirits matters to me because we built it ourselves, from scratch, without shortcuts. No outside agenda. No corporate brief. Just two blokes who wanted a proper drink and decided to make one."
                  </p>
                  <cite className="text-gold-400 font-semibold not-italic">Dan Freeman</cite>
                </blockquote>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
