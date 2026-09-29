import Link from 'next/link'
import Image from 'next/image'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'

// The four pledges, as data so the row can swipe on a phone (24 Sep 2026)
// rather than stack four full cards between the story and the reviews.
const commitments = [
  {
    figure: '5%',
    label: 'Of Profits',
    body: 'Donated annually to vetted armed forces charities supporting mental health, housing & transition services',
  },
  {
    figure: '10% Off',
    label: 'Forces Discount',
    body: 'For all serving personnel, veterans, reservists & immediate military families',
  },
  {
    figure: 'Guaranteed',
    label: 'Job Interviews',
    body: 'For all qualified veterans, reservists & military spouses applying to join our team',
  },
  {
    figure: 'Priority',
    label: 'Veteran Suppliers',
    body: 'Actively seeking veteran-owned businesses as suppliers & service providers',
  },
]

export default function SupportingOurForces() {
  return (
    <section className="py-16 band-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Commitment"
          intro="As veterans ourselves, supporting the Armed Forces community isn't just a pledge - it's personal."
        >
          Supporting Those Who Serve
        </SectionHeading>

        {/* Commitments */}
        <div className="mb-12">
          <ScrollRow
            ariaLabel="Our commitments to the armed forces community"
            cols="md:grid-cols-2 lg:grid-cols-4"
            items={commitments.map((c) => (
              <div
                key={c.label}
                className="h-full bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30 text-center"
              >
                <h3 className="text-2xl font-serif font-bold text-gold-300 mb-2">{c.figure}</h3>
                <p className="text-white font-semibold mb-2">{c.label}</p>
                <p className="text-parchment-300 text-sm">{c.body}</p>
              </div>
            ))}
          />
        </div>

        {/* Badges and CTA Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <Image
                src="/images/AFC_POSITIVE_RGB.png"
                alt="Armed Forces Covenant Signatory"
                width={120}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <Image
                src="/images/ERS_Bronze_Banner.webp"
                alt="Defence Employer Recognition Scheme Bronze Award"
                width={150}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <Image
                src="/images/British-Veteran-Owned-Logo-Standard.png"
                alt="British Veteran Owned"
                width={120}
                height={60}
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="text-center lg:text-right">
            <p className="text-parchment-300 mb-4">
              Read our full Armed Forces Covenant pledges
            </p>
            <Link
              href="/armed-forces-covenant/"
              className="inline-block px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              View Our Commitment
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
