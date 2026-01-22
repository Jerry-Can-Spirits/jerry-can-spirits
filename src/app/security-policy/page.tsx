import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Security Policy",
  description: "Jerry Can Spirits® security vulnerability disclosure policy. How to report security issues and our commitment to protecting your data.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/security-policy/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SecurityPolicy() {
  const lastUpdated = '23 December 2025'

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Security
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Security Policy
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
                Our Commitment to Security
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                At Jerry Can Spirits®, we take the security of our systems and the protection of our customers' data seriously. We appreciate the security research community's efforts in helping us maintain the highest security standards.
              </p>
              <p className="text-white leading-relaxed">
                This policy outlines our guidelines for responsible disclosure of security vulnerabilities and how we handle security reports.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Reporting a Vulnerability
              </h2>

              <div className="bg-gold-900/20 backdrop-blur-sm rounded-lg p-6 border border-gold-500/30 mb-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">How to Report</h3>
                <p className="text-white mb-4">
                  If you believe you've discovered a security vulnerability in our systems, please report it to us immediately:
                </p>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20">
                  <p className="text-white mb-2">
                    <strong className="text-gold-300">Email:</strong>{' '}
                    <a href="mailto:security@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      security@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white text-sm">
                    Please use "SECURITY VULNERABILITY" in the subject line
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                What to Include
              </h3>
              <p className="text-white mb-4">
                To help us understand and resolve the issue quickly, please include:
              </p>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Description of the vulnerability and its potential impact</li>
                <li>Step-by-step instructions to reproduce the issue</li>
                <li>Proof of concept (if applicable)</li>
                <li>Any relevant screenshots or logs</li>
                <li>Your contact information for follow-up questions</li>
                <li>CVE ID (if already assigned)</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Our Response Process
              </h2>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                Timeline
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li><strong className="text-gold-300">Initial Response:</strong> Within 48 hours of receiving your report</li>
                <li><strong className="text-gold-300">Status Updates:</strong> Regular updates throughout our investigation</li>
                <li><strong className="text-gold-300">Resolution:</strong> We aim to resolve critical issues within 30 days</li>
                <li><strong className="text-gold-300">Disclosure:</strong> Coordinated disclosure after the issue is resolved</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                What You Can Expect
              </h3>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Acknowledgment of your report within 48 hours</li>
                <li>Regular communication about the progress of your report</li>
                <li>Credit for your discovery (if you wish to be acknowledged)</li>
                <li>A transparent and collaborative approach to resolving the issue</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Responsible Disclosure Guidelines
              </h2>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                Please Do:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Report vulnerabilities as soon as you discover them</li>
                <li>Provide detailed information to help us reproduce and fix the issue</li>
                <li>Give us reasonable time to address the vulnerability before public disclosure</li>
                <li>Act in good faith to avoid privacy violations, data destruction, or service disruption</li>
              </ul>

              <div className="bg-red-900/40 backdrop-blur-sm rounded-lg p-6 border border-red-600/30">
                <h3 className="text-xl font-serif font-semibold text-red-200 mb-3">
                  Please Do Not:
                </h3>
                <ul className="list-disc list-inside text-red-100 space-y-2">
                  <li>Access or modify data that does not belong to you</li>
                  <li>Perform actions that could harm our systems or users</li>
                  <li>Publicly disclose the vulnerability before we have had time to address it</li>
                  <li>Exploit the vulnerability for personal gain</li>
                  <li>Access, download, or modify user data without explicit permission</li>
                  <li>Conduct testing that impacts our service availability</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Scope
              </h2>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                In Scope
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>jerrycanspirits.co.uk and all subdomains</li>
                <li>Our web application and API endpoints</li>
                <li>Authentication and authorization mechanisms</li>
                <li>Payment processing systems</li>
                <li>Customer data handling</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                Out of Scope
              </h3>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Third-party services we use (please report directly to the vendor)</li>
                <li>Social engineering attacks</li>
                <li>Physical security issues</li>
                <li>Denial of Service (DoS) attacks</li>
                <li>Email/SMS bombing</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Rewards & Recognition
              </h2>
              <p className="text-white mb-4">
                While we do not currently offer a bug bounty program, we deeply appreciate the efforts of security researchers who help keep our platform safe.
              </p>
              <div className="bg-gold-900/20 backdrop-blur-sm rounded-lg p-6 border border-gold-500/30">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">What We Offer</h3>
                <ul className="list-disc list-inside text-white space-y-2">
                  <li>Public acknowledgment of your contribution (with your permission)</li>
                  <li>A sincere thank you from our team</li>
                  <li>The satisfaction of helping protect our customers</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Legal Safe Harbor
              </h2>
              <p className="text-white mb-4">
                We consider security research conducted in accordance with this policy to be:
              </p>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li><strong className="text-gold-300">Authorized</strong> in accordance with the Computer Misuse Act 1990</li>
                <li><strong className="text-gold-300">Lawful</strong> and we will not pursue legal action against you</li>
                <li><strong className="text-gold-300">Good faith</strong> security research</li>
              </ul>
              <p className="text-white text-sm">
                We will not bring any legal action against researchers who discover and report vulnerabilities in accordance with this policy.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Security Best Practices
              </h2>
              <p className="text-white mb-4">
                We maintain the following security measures to protect our systems and customer data:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Content Security Policy (CSP) implementation</li>
                <li>DNSSEC for DNS security</li>
                <li>HSTS preloading for HTTPS enforcement</li>
                <li>Regular security audits and monitoring</li>
                <li>Encryption of data in transit and at rest</li>
                <li>Web Application Firewall (WAF) protection</li>
                <li>DDoS mitigation across multiple layers</li>
                <li>Regular security updates and patches</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Contact Information
              </h2>
              <p className="text-white mb-4">
                For security-related inquiries:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <div className="space-y-2">
                  <p className="text-white">
                    <strong className="text-gold-300">Security Email:</strong>{' '}
                    <a href="mailto:security@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      security@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">General Contact:</strong>{' '}
                    <a href="/contact" className="text-gold-300 hover:text-gold-200 underline">Contact Form</a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Company:</strong> Jerry Can Spirits® Ltd, United Kingdom
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Related Policies
              </h2>
              <div className="space-y-2">
                <p className="text-white">
                  • <a href="/privacy-policy" className="text-gold-300 hover:text-gold-200 underline">Privacy Policy</a> - How we handle your personal data
                </p>
                <p className="text-white">
                  • <a href="/cookie-policy" className="text-gold-300 hover:text-gold-200 underline">Cookie Policy</a> - Our use of cookies and tracking
                </p>
                <p className="text-white">
                  • <a href="/terms-of-service" className="text-gold-300 hover:text-gold-200 underline">Terms of Service</a> - Terms governing use of our website
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm mb-4">
            <strong className="text-gold-300">
              This Security Policy was last updated on {lastUpdated}.
            </strong>
          </p>
          <p className="text-parchment-400 text-xs">
            We may update this policy from time to time. We encourage you to review it periodically.
          </p>
        </div>
      </div>
    </main>
  )
}
