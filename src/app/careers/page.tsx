import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Careers | Jerry Can Spirits® - Join Our Team",
  description: "Explore career opportunities at Jerry Can Spirits®. Learn about our company culture and future hiring plans.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/careers',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Careers() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Careers
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Join Our Mission
          </h1>
          <p className="text-parchment-300 text-lg">
            Building the future of premium British spirits
          </p>
        </div>

        {/* Content */}
        <div className="max-w-none">
          <div className="space-y-8">

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <svg className="w-20 h-20 mx-auto text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4">
                  Not Currently Hiring
                </h2>
                <p className="text-white text-lg leading-relaxed mb-6">
                  We're not actively recruiting at this time as we focus on building our brand and establishing our presence in the premium spirits market.
                </p>
                <p className="text-parchment-300 leading-relaxed">
                  However, we're always interested in hearing from passionate individuals who share our vision for creating exceptional British rum.
                </p>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                About Jerry Can Spirits®
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Jerry Can Spirits® is a British spirits company dedicated to crafting premium rum that embodies the spirit of adventure and exploration. Our products are inspired by military heritage and engineered for those who value quality and authenticity.
              </p>
              <div className="bg-gold-900/20 backdrop-blur-sm rounded-lg p-6 border border-gold-500/30">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">Our Values</h3>
                <ul className="list-disc list-inside text-white space-y-2">
                  <li><strong className="text-gold-300">Excellence:</strong> Uncompromising commitment to quality in everything we do</li>
                  <li><strong className="text-gold-300">Heritage:</strong> Respect for tradition while embracing innovation</li>
                  <li><strong className="text-gold-300">Adventure:</strong> Bold spirit and readiness to explore new horizons</li>
                  <li><strong className="text-gold-300">Integrity:</strong> Honest, transparent business practices</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Future Opportunities
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                As we grow, we'll be looking for talented individuals in areas such as:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20">
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">Sales & Marketing</h3>
                  <p className="text-white text-sm">
                    Brand ambassadors, digital marketing, and sales professionals who can help us reach new audiences.
                  </p>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20">
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">Operations</h3>
                  <p className="text-white text-sm">
                    Supply chain, logistics, and operations specialists to support our growth.
                  </p>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20">
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">Product Development</h3>
                  <p className="text-white text-sm">
                    Master blenders and product developers to create new expressions.
                  </p>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20">
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">Customer Experience</h3>
                  <p className="text-white text-sm">
                    Customer service professionals dedicated to delivering exceptional experiences.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Stay Connected
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Interested in joining us when we start hiring? We'd love to hear from you.
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-gold-300 mb-4">Get in Touch</h3>
                <div className="space-y-3">
                  <p className="text-white">
                    <strong className="text-gold-300">Email:</strong>{' '}
                    <a href="mailto:careers@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      careers@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white text-sm">
                    Send us your CV and a brief introduction. We'll keep your details on file and reach out when opportunities arise that match your skills and experience.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Follow Our Journey
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Want to stay updated on our progress and be first to know about career opportunities?
              </p>
              <div className="space-y-3">
                <p className="text-white">
                  • Subscribe to our newsletter on the{' '}
                  <a href="/" className="text-gold-300 hover:text-gold-200 underline">homepage</a>
                </p>
                <p className="text-white">
                  • Follow us on social media (links in the footer)
                </p>
                <p className="text-white">
                  • Check back here for updates on open positions
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-jerry-green-800/60 to-gold-900/40 backdrop-blur-sm rounded-xl border border-gold-500/30 text-center">
          <h3 className="text-2xl font-serif font-bold text-white mb-4">
            Questions About Careers?
          </h3>
          <p className="text-parchment-300 mb-6">
            We're happy to answer any questions about working at Jerry Can Spirits®
          </p>
          <a
            href="mailto:careers@jerrycanspirits.co.uk"
            className="inline-block px-8 py-3 bg-gold-500 hover:bg-gold-600 text-jerry-green-900 font-semibold rounded-lg transition-colors duration-200"
          >
            Email Us
          </a>
        </div>
      </div>
    </main>
  )
}
