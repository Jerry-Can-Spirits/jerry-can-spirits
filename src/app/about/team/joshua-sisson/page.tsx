import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import FAQAccordion, { type FAQAccordionItem } from '@/components/FAQAccordion'
import TeamMeetRow from '@/components/TeamMeetRow'
import { OG_IMAGE } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'

const PHOTO = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2d4ac61a-0e68-460d-895f-839bc7c69b00/public'
// A square head-and-shoulders crop of the same full-length photo, cut by
// Cloudflare Images (trim=top;right;bottom;left in source pixels, 318x767).
const HEADSHOT = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2d4ac61a-0e68-460d-895f-839bc7c69b00/trim=25;98;542;20'

// His answers to the Head of Sales question set (19 Oct 2026), in his words,
// spelling and number style tidied only. The "how is it made" answer is put
// into the approved production wording (Dan, 19 Oct): the process is
// "macerated by our British partner distillery", never "we macerate".
const askJosh: { group: string; items: FAQAccordionItem[] }[] = [
  {
    group: 'Selling',
    items: [
      {
        question: 'What is the first thing a bar asks you?',
        answer:
          'The first question I generally get asked by bars is, “How is your rum made?” Expedition Spiced Rum starts with a Caribbean rum base, macerated in small batches by our British partner distillery with seven real spices, including Madagascan vanilla, cinnamon, ginger, orange peel and cloves. Two natural sweeteners balance it, and bourbon oak gives it its smooth, warming character. The finished rum is 40% ABV, made with real ingredients and no artificial flavourings.',
      },
      {
        question: 'What is the hardest objection you hear, and how do you answer it?',
        answer:
          'The hardest objection I generally hear is the price, especially when bars compare us to larger, established rum brands. I explain that we’re a small, veteran-owned business producing a quality spiced rum using real ingredients, while also giving back to the veteran community. However, I’ve learnt that persistence is key. I’ve secured far more sales by returning to bars two or three times, building relationships and demonstrating our passion for the product than I have on my first visit. We’re also willing to negotiate and offer competitive deals, but the best deals come from building strong, mutually beneficial relationships. We want to see that a bar is genuinely willing to work with us, support the brand and grow alongside us. Ultimately, it’s about creating long-term partnerships rather than simply making a one-off sale.',
      },
      {
        question: 'What happens the moment someone tastes it for the first time?',
        answer:
          'Generally, people are blown away by the flavour, and everyone always goes in for a second or third taste. It’s very rare we get any negative feedback, but all feedback is welcome and taken on board for the next batches, or even the next spirit we make.',
      },
      {
        question: 'What makes a venue a good fit, and when do you walk away?',
        answer:
          'For me, a good venue is one that values quality, supports independent brands and is willing to build a genuine working relationship with us. It’s not necessarily about how big or busy the venue is, but whether they believe in our product, appreciate our veteran-owned ethos and are willing to give Jerry Can Spirits a real opportunity. As for walking away from a sale, I don’t give up easily. I’m a firm believer in persistence, and sometimes it takes several visits to build that trust. However, if a venue is only interested in driving the price down without offering any commitment or willingness to work together, then sometimes it’s better to walk away. I’d rather build ten strong, lasting partnerships than chase twenty one-off sales that don’t benefit either side.',
      },
      {
        question: 'Independent bar or big chain: which is harder to get into?',
        answer:
          'Difficult to say, as most of my sales have been to independent bars. Large chains tend to tie themselves to a few spirit brands across all their bars and build big profits. At Jerry Can Spirits, we aim to deliver a trusted product over making big bucks.',
      },
    ],
  },
  {
    group: 'The trade',
    items: [
      {
        question: 'What do bar staff need from a brand that most brands don’t give them?',
        answer:
          'Bar staff need more than just a bottle on the shelf. They need support, product knowledge, tastings and a genuine relationship with the brand. I believe if staff understand and enjoy our rum, they’re far more likely to recommend it. It’s about building relationships, not just making sales.',
      },
      {
        question: 'How should a bar serve it?',
        answer:
          'I always give three options: on its own with ice, with cola, or with ginger beer. I find these three work best, and most if not all people find their favourite from there.',
      },
      {
        question: 'What is the best thing a venue has done with it that you didn’t expect?',
        answer:
          'Posting it on social media is a big win for us, but the Imperial pub in Hereford has since used our rum as prizes in their weekly quiz, which really gives us the exposure a small-batch brand like ours needs.',
      },
    ],
  },
  {
    group: 'The drinks',
    items: [
      {
        question: 'What do you drink when you’re off the clock?',
        answer: 'Cider, lager, red wine and, without a doubt, our own Expedition Spiced Rum.',
      },
      {
        question: 'One cocktail every home bar should be able to make?',
        answer: 'A Snowball. Nice and simple, and yet I have had some awful ones in the past. Sorry, Uncle Mick.',
      },
      {
        question: 'Neat, on ice or mixed: how do you take Expedition Spiced Rum?',
        answer:
          'As with my sales to bars, I always give three options: on its own, with cola or with ginger beer. I prefer a quick one on the rocks, but if I’m having a few, I’ll have it with ginger beer.',
      },
    ],
  },
  {
    group: 'The person',
    items: [
      {
        question: 'Best sales lesson you ever learned the hard way?',
        answer:
          'Don’t take everyone’s first response as gospel. Sometimes showing loyalty and commitment is a big win, and then they tend to warm to you.',
      },
      {
        question: 'What does a good week look like for you?',
        answer: 'Off work, with family and friends. I enjoy being out in nature and, of course, a good spiced rum.',
      },
      {
        question: 'What would you tell someone starting their first sales job?',
        answer:
          'Be confident in what you are selling. You can never know too much about your product or the area of sales you’re working in. And a no isn’t forever, just not now. Never fail to try again.',
      },
    ],
  },
]

// Person schema. Only what has been confirmed: name, role, photo and the
// company. Service history and the rest are added as they arrive.
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Joshua Sisson',
  jobTitle: 'Head of Sales',
  url: 'https://jerrycanspirits.co.uk/about/team/joshua-sisson/',
  image: PHOTO,
  description: 'Head of Sales at Jerry Can Spirits.',
  worksFor: ORG_REF,
}

const DESCRIPTION =
  'Joshua Sisson, Head of Sales at Jerry Can Spirits, on why the rum has to stand on its own and on getting it into people’s hands.'

export const metadata: Metadata = {
  title: 'Joshua Sisson - Head of Sales',
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/joshua-sisson/',
  },
  openGraph: {
    title: 'Joshua Sisson - Head of Sales | Jerry Can Spirits®',
    description: DESCRIPTION,
    url: 'https://jerrycanspirits.co.uk/about/team/joshua-sisson',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'profile',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Joshua Sisson - Head of Sales | Jerry Can Spirits®',
    description: DESCRIPTION,
    images: OG_IMAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function JoshuaSissonPage() {
  return (
    <main>
      <StructuredData data={personSchema} id="joshua-sisson-person-schema" />

      {/* Who he is: header, photo slot, quick facts and the bio. */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about/story' },
              { label: 'Team', href: '/about/team' },
              { label: 'Joshua Sisson' },
            ]}
            className="mb-8"
          />

          <Link
            href="/about/team/"
            className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors mb-8 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Team</span>
          </Link>

          <SectionHeading as="h1" eyebrow="Head of Sales">
            Joshua Sisson
          </SectionHeading>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left column: photo and quick facts */}
            <div className="lg:col-span-1 space-y-6">
              {/* The headshot crop: the full-length photo would show only his
                  chest in a square. */}
              <div className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src={HEADSHOT}
                  alt="Joshua Sisson - Head of Sales at Jerry Can Spirits"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-4 pb-2 border-b border-gold-500/20">
                  Quick Facts
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Role</p>
                    <p className="text-parchment-200">Head of Sales</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Based</p>
                    <p className="text-parchment-200">Hereford, Herefordshire</p>
                    <p className="text-parchment-300 text-xs">Covers UK trade sales on request</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Background</p>
                    <p className="text-parchment-200">Mental health and criminal justice</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Favourite Spirit</p>
                    <p className="text-parchment-200">Irish whiskey, Redbreast 18</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Signature Cocktail</p>
                    <p className="text-parchment-200">Mojito</p>
                    <p className="text-parchment-300 text-xs">If a bar can’t deliver on that, it isn’t the bar for me.</p>
                  </div>
                </div>
              </div>

              {/* Fun Fact, as on Dan's page. A placeholder until his own
                  arrives (Dan, 19 Oct). */}
              <div className="bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <p className="text-gold-300 font-semibold text-sm mb-1">Did You Know?</p>
                <p className="text-parchment-300 text-sm">
                  Joshua used to own and operate an ice cream van.
                </p>
              </div>
            </div>

            {/* Right column: how he came in, the bio and Ask Josh, in his words */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20 space-y-5">
                <h2 className="text-2xl font-serif font-bold text-white">How I Got Here</h2>
                <p className="text-parchment-200 leading-relaxed">
                  I initially got involved with Jerry Can Spirits as an investor, but my passion for the brand, its veteran-owned roots and what it stands for naturally led me into a role in sales, helping grow the business and get our rum out there.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  I joined because I believed in my mates, their vision and the ethos behind the brand. I wanted to be part of something meaningful and help turn their passion into a successful business.
                </p>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20 space-y-5">
                <h2 className="text-2xl font-serif font-bold text-white">Why Jerry Can Spirits Matters to Me</h2>
                <p className="text-parchment-200 leading-relaxed">
                  For me, Jerry Can Spirits is about much more than selling a bottle of rum. I believe in what we’re building, the people behind it, and what the brand stands for.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  I came into Jerry Can Spirits because I saw the potential to build something genuinely different. We’re not trying to imitate the biggest names on the shelf. We’re building our own identity, backed by hard work, personality and a product that I’m genuinely proud to put in front of people.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  What really convinced me was the rum itself. Expedition Spiced Rum has to stand on its own. You can have great branding, a good story and strong marketing, but if what’s inside the bottle doesn’t deliver, none of that matters. I believe ours does.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  My role is about getting that bottle into people’s hands: building relationships with pubs, bars, retailers and customers, getting people to actually taste it, and turning Jerry Can Spirits from a small independent name into a brand people recognise and ask for.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  I’m proud to represent a company that has been built from the ground up. There’s something exciting about being there at the beginning, knowing that every new stockist, every tasting and every person who recommends our rum is another step forward.
                </p>
              </div>

              {/* Ask Josh: closed by default, so thirteen answers take the
                  space of a short list, as on Dan's page. */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-6">Ask Josh</h2>
                <div className="space-y-6">
                  {askJosh.map((section) => (
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
      </section>

      {/* His line, on its own */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <figure className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 sm:p-10 border border-gold-500/20 text-center">
            <blockquote className="text-xl sm:text-2xl font-serif text-white leading-relaxed">
              “I believe in Jerry Can Spirits because I believe in the product. You can build the best brand in the world, but the liquid still has to deliver. Ours does. My job now is to get it into people’s hands and give them the chance to discover that for themselves.”
            </blockquote>
            <figcaption className="mt-6 text-sm uppercase tracking-widest text-gold-300 font-semibold">
              Joshua Sisson, Head of Sales
            </figcaption>
          </figure>
        </div>
      </section>

      <TeamMeetRow current="joshua-sisson" />
    </main>
  )
}
