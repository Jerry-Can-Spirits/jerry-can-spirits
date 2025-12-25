import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Cookie Policy | Jerry Can Spirits - GDPR Compliant Cookie Information",
  description: "Learn about how Jerry Can Spirits uses cookies to enhance your browsing experience and protect your privacy. Manage your cookie preferences.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/cookie-policy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CookiePolicy() {
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
            Cookie Policy
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
                What Are Cookies?
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                understanding how you use our site.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                How We Use Cookies
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Jerry Can Spirits uses cookies for several purposes to enhance your browsing experience 
                and improve our services. We categorize our cookies into different types based on their function.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Types of Cookies We Use
              </h2>
              
              {/* Essential Cookies */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 mb-6">
                <h3 className="text-xl font-serif font-semibold text-gold-300 mb-3">Essential Cookies</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-white"><strong className="text-gold-300">Purpose:</strong> Required for basic website functionality</p>
                  <p className="text-white"><strong className="text-gold-300">Duration:</strong> Session and persistent (up to 30 days)</p>
                  <p className="text-white"><strong className="text-gold-300">Legal Basis:</strong> Legitimate interest (essential for service provision)</p>
                </div>
                <h4 className="text-lg font-semibold text-gold-300 mb-3">Examples include:</h4>
                <ul className="list-disc list-inside text-white space-y-1">
                  <li><code className="bg-jerry-green-700 px-2 py-1 rounded text-gold-200">ageGateVerified</code> - Remembers age verification status (30 days)</li>
                  <li><code className="bg-jerry-green-700 px-2 py-1 rounded text-gold-200">theme</code> - Stores your preferred light/dark theme (localStorage)</li>
                  <li>Session cookies for site functionality and security</li>
                </ul>
              </div>

              {/* Marketing Cookies */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 mb-6">
                <h3 className="text-xl font-serif font-semibold text-gold-300 mb-3">Marketing Cookies</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-white"><strong className="text-gold-300">Purpose:</strong> Personalize content and track marketing effectiveness</p>
                  <p className="text-white"><strong className="text-gold-300">Duration:</strong> Up to 2 years</p>
                  <p className="text-white"><strong className="text-gold-300">Legal Basis:</strong> Consent</p>
                </div>
                <h4 className="text-lg font-semibold text-gold-300 mb-3">Examples include:</h4>
                <ul className="list-disc list-inside text-white space-y-1">
                  <li><strong className="text-gold-300">Klaviyo:</strong> Email marketing and customer segmentation</li>
                  <li><strong className="text-gold-300">Social Media Pixels:</strong> Track social media campaign effectiveness</li>
                  <li>Newsletter signup tracking and preferences</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 mb-6">
                <h3 className="text-xl font-serif font-semibold text-gold-300 mb-3">Analytics Cookies</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-white"><strong className="text-gold-300">Purpose:</strong> Understand how visitors interact with our website</p>
                  <p className="text-white"><strong className="text-gold-300">Duration:</strong> Up to 2 years</p>
                  <p className="text-white"><strong className="text-gold-300">Legal Basis:</strong> Consent</p>
                </div>
                <h4 className="text-lg font-semibold text-gold-300 mb-3">Examples include:</h4>
                <ul className="list-disc list-inside text-white space-y-1">
                  <li><strong className="text-gold-300">Google Analytics:</strong> Website traffic and user behavior analysis</li>
                  <li>Page performance monitoring</li>
                  <li>User journey tracking (anonymized)</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Third-Party Services
              </h2>
              <p className="text-white mb-4">We work with trusted third-party services that may set their own cookies:</p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-gold-500 pl-6 py-2">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Klaviyo (Marketing)</h4>
                  <p className="text-white">
                    Email marketing platform used for newsletters and customer communications.{' '}
                    <a href="https://www.klaviyo.com/privacy" target="_blank" rel="noopener noreferrer" 
                       className="text-gold-300 hover:text-gold-200 underline">
                      View Klaviyo's Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="border-l-4 border-gold-500 pl-6 py-2">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Google Analytics (Analytics)</h4>
                  <p className="text-white">
                    Web analytics service to understand website usage patterns.{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                       className="text-gold-300 hover:text-gold-200 underline">
                      View Google's Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="border-l-4 border-gold-500 pl-6 py-2">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Trustpilot (Reviews & Marketing)</h4>
                  <p className="text-white">
                    Customer review platform used to collect and display verified product reviews.{' '}
                    <a href="https://legal.trustpilot.com/for-reviewers/end-user-privacy-terms" target="_blank" rel="noopener noreferrer"
                       className="text-gold-300 hover:text-gold-200 underline">
                      View Trustpilot's Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Managing Your Cookie Preferences
              </h2>
              <p className="text-white mb-6">You have several options for controlling cookies:</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h4 className="text-lg font-semibold text-gold-300 mb-3">On Our Website</h4>
                  <ul className="list-disc list-inside text-white space-y-2">
                    <li>Use our cookie banner to select your preferences</li>
                    <li>Change your mind at any time using the cookie settings (found in our website footer)</li>
                    <li>Essential cookies cannot be disabled as they're required for basic functionality</li>
                  </ul>
                </div>

                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h4 className="text-lg font-semibold text-gold-300 mb-3">In Your Browser</h4>
                  <ul className="list-disc list-inside text-white space-y-2">
                    <li>Most browsers allow you to block cookies entirely</li>
                    <li>You can delete existing cookies from your browser settings</li>
                    <li>Set preferences for specific websites</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gold-300 mb-3">Browser-Specific Instructions:</h4>
                <ul className="grid md:grid-cols-2 gap-2 text-white">
                  <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer"
                       className="text-gold-300 hover:text-gold-200 underline">
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer"
                       className="text-gold-300 hover:text-gold-200 underline">
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer"
                       className="text-gold-300 hover:text-gold-200 underline">
                      Safari
                    </a>
                  </li>
                  <li>
                    <a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" target="_blank" rel="noopener noreferrer"
                       className="text-gold-300 hover:text-gold-200 underline">
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Data Retention
              </h2>
              <p className="text-white mb-4">
                We retain cookie data for different periods depending on the cookie type:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li><strong className="text-gold-300">Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong className="text-gold-300">Essential cookies:</strong> Up to 30 days</li>
                <li><strong className="text-gold-300">Marketing cookies:</strong> Up to 2 years (or until consent is withdrawn)</li>
                <li><strong className="text-gold-300">Analytics cookies:</strong> Up to 2 years (or until consent is withdrawn)</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Your Rights
              </h2>
              <p className="text-white mb-4">Under GDPR and UK GDPR, you have the following rights regarding your data:</p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li><strong className="text-gold-300">Right to withdraw consent:</strong> Change your cookie preferences at any time</li>
                <li><strong className="text-gold-300">Right to access:</strong> Request information about data we hold about you</li>
                <li><strong className="text-gold-300">Right to rectification:</strong> Request correction of inaccurate data</li>
                <li><strong className="text-gold-300">Right to erasure:</strong> Request deletion of your data</li>
                <li><strong className="text-gold-300">Right to data portability:</strong> Request transfer of your data</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Changes to This Policy
              </h2>
              <p className="text-white">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or legal requirements. We will notify you of any significant changes by updating the 
                "Last updated" date at the top of this page.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Contact Us
              </h2>
              <p className="text-white mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, 
                please contact us:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <div className="space-y-2">
                  <p className="text-white">
                    <strong className="text-gold-300">Email:</strong>{' '}
                    <a href="mailto:privacy@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      privacy@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Website:</strong>{' '}
                    <a href="/contact" className="text-gold-300 hover:text-gold-200 underline">Contact Form</a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Address:</strong><br />
                    Jerry Can Spirits Ltd<br />
                    United Kingdom
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm">
            <strong className="text-gold-300">
              This cookie policy was last updated on {lastUpdated} and is compliant with GDPR, UK GDPR, and applicable data protection laws.
            </strong>
          </p>
        </div>
      </div>
    </main>
  )
}