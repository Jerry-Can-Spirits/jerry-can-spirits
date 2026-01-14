import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Terms of Service | Jerry Can Spirits® - Terms & Conditions",
  description: "Jerry Can Spirits® Terms of Service and conditions of use. Legal terms governing the use of our website and purchase of our premium spirits.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/terms-of-service/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsOfService() {
  const lastUpdated = '4 September 2025'

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Legal
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-parchment-300 text-sm">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-none">
          <div className="space-y-8">
            
            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                1. Acceptance of Terms
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                By accessing and using the Jerry Can Spirits® website ("the Site"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                2. About Jerry Can Spirits®
              </h2>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <p className="text-white mb-2">
                  <strong className="text-gold-300">Company:</strong> Jerry Can Spirits® Ltd
                </p>
                <p className="text-white mb-2">
                  <strong className="text-gold-300">Registration:</strong> England and Wales
                </p>
                <p className="text-white mb-2">
                  <strong className="text-gold-300">Trademark:</strong> UK00004263767 (Classes 33, 35)
                </p>
                <p className="text-white">
                  <strong className="text-gold-300">Contact:</strong>{' '}
                  <a href="mailto:legal@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                    legal@jerrycanspirits.co.uk
                  </a>
                </p>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                3. Age Restrictions
              </h2>
              <div className="bg-red-900/40 backdrop-blur-sm rounded-lg p-6 border border-red-600/30">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-200 mb-2">18+ Only</h3>
                    <p className="text-red-100 mb-2">
                      You must be 18 years or older to access this website and purchase our products. By using this site, you warrant that you are of legal drinking age in your jurisdiction.
                    </p>
                    <p className="text-red-100">
                      We reserve the right to request proof of age at any time and may refuse service or cancel orders if adequate proof cannot be provided.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                4. Use of the Website
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                4.1 Permitted Use
              </h3>
              <p className="text-white mb-4">
                You may use our website for lawful purposes only. You agree not to use the site:
              </p>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>To attempt unauthorized access to our systems or networks</li>
                <li>To introduce viruses, trojans, or other malicious or technologically harmful material</li>
                <li>To attempt to interfere with the proper working of the website</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                4.2 Account Security
              </h3>
              <p className="text-white mb-4">
                If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                5. Product Information and Orders
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                5.1 Product Descriptions
              </h3>
              <p className="text-white mb-4">
                We strive to ensure product information is accurate. However, we do not warrant that product descriptions or other content is error-free, complete, or current.
              </p>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                5.2 Orders and Payment
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>All orders are subject to acceptance and availability</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>Prices are subject to change without notice</li>
                <li>Payment must be received before dispatch</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                5.3 Delivery
              </h3>
              <p className="text-white mb-4">
                Delivery times are estimates and not guaranteed. Risk of loss and title pass to you upon delivery. 
                See our <a href="/shipping-returns" className="text-gold-300 hover:text-gold-200 underline">Shipping & Returns</a> policy for full details.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                6. Intellectual Property Rights
              </h2>
              <p className="text-white mb-4">
                The Jerry Can Spirits® website and its content, features, and functionality are owned by Jerry Can Spirits® Ltd and protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <div className="bg-gold-900/20 backdrop-blur-sm rounded-lg p-6 border border-gold-500/30 mb-4">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">Trademark Notice</h3>
                <p className="text-white mb-2">
                  Jerry Can Spirits® is a registered trademark (UK00004263767) of Jerry Can Spirits Ltd for:
                </p>
                <ul className="list-disc list-inside text-white space-y-1 ml-4 mb-3">
                  <li><strong>Class 33:</strong> Spirits, alcoholic beverages, rum, and related products</li>
                  <li><strong>Class 35:</strong> Retail and wholesale services in relation to alcoholic beverages</li>
                </ul>
                <p className="text-white text-sm">
                  All trademarks, logos, and service marks displayed on this website are our property or the property of other third parties. You are not permitted to use these marks without our prior written consent or the consent of such third party.
                </p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">You may not:</h3>
                <ul className="list-disc list-inside text-white space-y-1">
                  <li>Reproduce, distribute, or create derivative works</li>
                  <li>Use our registered trademarks without written permission</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Remove or alter copyright or trademark notices</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                7. Privacy Policy
              </h2>
              <p className="text-white mb-4">
                Your privacy is important to us. Please review our{' '}
                <a href="/privacy-policy" className="text-gold-300 hover:text-gold-200 underline">Privacy Policy</a>{' '}
                and{' '}
                <a href="/cookie-policy" className="text-gold-300 hover:text-gold-200 underline">Cookie Policy</a>{' '}
                which also govern your use of the Site.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                8. Limitation of Liability
              </h2>
              <p className="text-white mb-4">
                To the maximum extent permitted by law, Jerry Can Spirits® Ltd shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from:
              </p>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Use or inability to use our website or products</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Any other matter relating to the website or service</li>
              </ul>
              <p className="text-white text-sm">
                This limitation applies whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                9. Indemnification
              </h2>
              <p className="text-white mb-4">
                You agree to defend, indemnify, and hold harmless Jerry Can Spirits® Ltd from and against any claims, damages, obligations, losses, liabilities, costs, and expenses arising from your use of the website or violation of these terms.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                10. Governing Law
              </h2>
              <p className="text-white mb-4">
                These Terms of Service shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                11. Changes to Terms
              </h2>
              <p className="text-white mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the site after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                12. Severability
              </h2>
              <p className="text-white mb-4">
                If any provision of these terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                13. Competitions and Promotions
              </h2>

              <div className="space-y-4 text-white leading-relaxed">
                <p>
                  From time to time, Jerry Can Spirits® may run competitions, prize draws, or promotional events (&quot;Promotions&quot;) via our website or social media platforms.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">Eligibility</h3>
                  <ul className="list-disc list-inside space-y-1 text-parchment-200 ml-4">
                    <li>Open to UK residents aged 18 or over only</li>
                    <li>Employees of Jerry Can Spirits® and their immediate families are not eligible</li>
                    <li>Entry is free and no purchase is necessary unless otherwise stated</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">Entry and Winner Selection</h3>
                  <p className="text-parchment-200 mb-2">
                    Entry methods, prize details, and entry periods will be specified for each Promotion. Winners will be selected at random or as otherwise stated, and notified via the platform on which they entered or by email within 7 days of the draw date.
                  </p>
                  <p className="text-parchment-200">
                    Winners must respond within 28 days or the prize will be forfeited and a replacement winner selected.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">General Conditions</h3>
                  <ul className="list-disc list-inside space-y-1 text-parchment-200 ml-4">
                    <li>Prizes are non-transferable and no cash alternative is available</li>
                    <li>The Promoter reserves the right to verify eligibility and request proof of age</li>
                    <li>The Promoter&apos;s decision is final and no correspondence will be entered into</li>
                    <li>The Promoter reserves the right to cancel or amend Promotions at any time</li>
                  </ul>
                </div>

                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20">
                  <p className="text-sm text-parchment-300">
                    <strong className="text-gold-300">Platform Disclaimer:</strong> Promotions run via social media platforms are in no way sponsored, endorsed, administered by, or associated with Meta, Instagram, Facebook, Twitter/X, or any other social media platform. By entering, you release these platforms from any liability.
                  </p>
                </div>

                <p className="text-parchment-200">
                  <strong className="text-gold-300">Promoter:</strong> Jerry Can Spirits® Ltd, England and Wales. Contact:{' '}
                  <a href="mailto:legal@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                    legal@jerrycanspirits.co.uk
                  </a>
                </p>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                14. Contact Information
              </h2>
              <p className="text-white mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <div className="space-y-2">
                  <p className="text-white">
                    <strong className="text-gold-300">Email:</strong>{' '}
                    <a href="mailto:legal@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      legal@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Website:</strong>{' '}
                    <a href="/contact" className="text-gold-300 hover:text-gold-200 underline">Contact Form</a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Address:</strong><br />
                    Jerry Can Spirits® Ltd<br />
                    United Kingdom
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm mb-4">
            <strong className="text-gold-300">
              These Terms of Service were last updated on {lastUpdated}.
            </strong>
          </p>
          <p className="text-parchment-400 text-xs">
            These terms are subject to legal review and may be updated as required. 
            Current terms are provisional and will be finalized by our legal team.
          </p>
        </div>
      </div>
    </main>
  )
}