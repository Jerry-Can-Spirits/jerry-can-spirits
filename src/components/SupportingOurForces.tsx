import Link from 'next/link'
import Image from 'next/image'

export default function SupportingOurForces() {
  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Our Commitment
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Supporting Those Who Serve
          </h2>
          <p className="text-parchment-300 text-lg max-w-2xl mx-auto">
            As veterans ourselves, supporting the Armed Forces community isn't just a pledge - it's personal.
          </p>
        </div>

        {/* Commitments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Charity Donation */}
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-gold-300 mb-2">5-15%</h3>
            <p className="text-white font-semibold mb-2">Of Net Profits</p>
            <p className="text-parchment-300 text-sm">
              Donated annually to vetted armed forces charities supporting mental health, housing & transition services
            </p>
          </div>

          {/* Military Discount */}
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-gold-300 mb-2">10% Off</h3>
            <p className="text-white font-semibold mb-2">Forces Discount</p>
            <p className="text-parchment-300 text-sm">
              For all serving personnel, veterans, reservists & immediate military families
            </p>
          </div>

          {/* Employment */}
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-gold-300 mb-2">Guaranteed</h3>
            <p className="text-white font-semibold mb-2">Job Interviews</p>
            <p className="text-parchment-300 text-sm">
              For all qualified veterans, reservists & military spouses applying to join our team
            </p>
          </div>

          {/* Veteran Suppliers */}
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gold-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-gold-300 mb-2">Priority</h3>
            <p className="text-white font-semibold mb-2">Veteran Suppliers</p>
            <p className="text-parchment-300 text-sm">
              Actively seeking veteran-owned businesses as suppliers & service providers
            </p>
          </div>
        </div>

        {/* Badges and CTA Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <Image
                src="/images/AFC_Logo.png"
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
                src="/images/BVO.webp"
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
              href="/armed-forces-covenant"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span>View Our Commitment</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
