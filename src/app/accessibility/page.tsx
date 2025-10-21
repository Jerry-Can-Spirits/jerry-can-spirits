import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Accessibility Statement | Jerry Can Spirits - Web Accessibility Commitment",
  description: "Jerry Can Spirits accessibility statement and commitment to providing an inclusive web experience for all users, including those with disabilities.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function Accessibility() {
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
            Accessibility Statement
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
                Our Commitment
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Jerry Can Spirits is committed to providing a website that is accessible to all users, 
                including those with disabilities. We believe that everyone should have equal access 
                to information and functionality on our website.
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <p className="text-gold-300 font-semibold mb-2">Our Goal:</p>
                <p className="text-white">
                  To ensure our website meets or exceeds the Web Content Accessibility Guidelines (WCAG) 2.1 
                  Level AA standards, making it accessible and usable for people with diverse abilities and disabilities.
                </p>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Accessibility Standards
              </h2>
              <p className="text-white mb-4">
                We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. 
                These guidelines explain how to make web content accessible to people with disabilities.
              </p>
              
              <h3 className="text-xl font-serif font-semibold text-gold-300 mt-6 mb-3">
                WCAG 2.1 Principles
              </h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Perceivable</h4>
                  <p className="text-white text-sm">
                    Information must be presentable in ways users can perceive, including alternative text 
                    for images and sufficient color contrast.
                  </p>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Operable</h4>
                  <p className="text-white text-sm">
                    Interface components must be operable through keyboard navigation and provide 
                    sufficient time for users to interact with content.
                  </p>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Understandable</h4>
                  <p className="text-white text-sm">
                    Information and UI operation must be understandable, with clear navigation 
                    and predictable functionality.
                  </p>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Robust</h4>
                  <p className="text-white text-sm">
                    Content must be robust enough to be interpreted reliably by assistive technologies 
                    and future web technologies.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Current Accessibility Features
              </h2>
              <p className="text-white mb-4">
                We have implemented the following accessibility features on our website:
              </p>

              <div className="space-y-4">
                <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                  Navigation & Structure
                </h3>
                <ul className="list-disc list-inside text-white space-y-2 mb-6">
                  <li>Logical heading structure (H1, H2, H3, etc.)</li>
                  <li>Skip navigation links for keyboard users</li>
                  <li>Consistent navigation across all pages</li>
                  <li>Clear page titles and meta descriptions</li>
                </ul>

                <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                  Visual Design
                </h3>
                <ul className="list-disc list-inside text-white space-y-2 mb-6">
                  <li>High contrast colour scheme for readability</li>
                  <li>Scalable text that can be enlarged up to 200%</li>
                  <li>Alternative text for all informative images</li>
                  <li>Colour is not the sole means of conveying information</li>
                  <li>Readable fonts and appropriate font sizes</li>
                </ul>

                <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                  Interaction & Forms
                </h3>
                <ul className="list-disc list-inside text-white space-y-2 mb-6">
                  <li>Keyboard navigation for all interactive elements</li>
                  <li>Clear focus indicators</li>
                  <li>Form labels properly associated with inputs</li>
                  <li>Error messages clearly described</li>
                  <li>Sufficient time limits for form completion</li>
                </ul>

                <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                  Technical Implementation
                </h3>
                <ul className="list-disc list-inside text-white space-y-2">
                  <li>Semantic HTML markup</li>
                  <li>ARIA labels and descriptions where needed</li>
                  <li>Valid HTML and CSS code</li>
                  <li>Compatible with screen readers and assistive technologies</li>
                  <li>Responsive design for various devices and screen sizes</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Ongoing Improvements
              </h2>
              <p className="text-white mb-4">
                We are continuously working to improve the accessibility of our website. Current initiatives include:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <ul className="list-disc list-inside text-white space-y-2">
                  <li>Regular accessibility audits and testing with real users</li>
                  <li>Staff training on accessibility best practices</li>
                  <li>Updates to ensure compatibility with the latest assistive technologies</li>
                  <li>User feedback integration for continuous improvement</li>
                  <li>Third-party accessibility testing and certification</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Known Limitations
              </h2>
              <p className="text-white mb-4">
                We acknowledge that some areas of our website may not yet be fully accessible. 
                We are actively working to address these limitations:
              </p>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Some decorative background elements may not be optimally described</li>
                <li>Complex interactive components are being enhanced for better screen reader support</li>
                <li>Video content accessibility features are being implemented</li>
                <li>PDF documents are being reviewed for accessibility compliance</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Assistive Technology Compatibility
              </h2>
              <p className="text-white mb-4">
                Our website is designed to be compatible with common assistive technologies and browsers.
                We are currently conducting comprehensive testing with:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-3">Screen Readers (Testing in Progress)</h3>
                  <ul className="list-disc list-inside text-white space-y-1 text-sm">
                    <li>NVDA (Windows)</li>
                    <li>JAWS (Windows)</li>
                    <li>VoiceOver (macOS/iOS)</li>
                    <li>TalkBack (Android)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-3">Browsers</h3>
                  <ul className="list-disc list-inside text-white space-y-1 text-sm">
                    <li>Chrome, Firefox, Safari, Edge</li>
                    <li>Mobile browsers on iOS and Android</li>
                    <li>High contrast mode support</li>
                    <li>Zoom functionality up to 200%</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-jerry-green-800/40 border-l-4 border-gold-500">
                <p className="text-white text-sm">
                  <strong className="text-gold-300">Note:</strong> We are actively testing with real users and assistive technology.
                  If you experience any accessibility issues, please report them to help us improve.
                </p>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Feedback & Support
              </h2>
              <p className="text-white mb-4">
                We value your feedback on the accessibility of our website. If you encounter any 
                accessibility barriers or have suggestions for improvement, please contact us:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <div className="space-y-3">
                  <p className="text-white">
                    <strong className="text-gold-300">Email:</strong>{' '}
                    <a href="mailto:accessibility@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      accessibility@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Subject Line:</strong> Website Accessibility Feedback
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Response Time:</strong> We aim to respond within 48 hours
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Alternative Contact:</strong>{' '}
                    <a href="/contact" className="text-gold-300 hover:text-gold-200 underline">Contact Form</a>
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Enforcement & Complaints
              </h2>
              <p className="text-white mb-4">
                If you are not satisfied with our response to your accessibility concerns, you may contact:
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-gold-500 pl-6 py-2">
                  <h4 className="text-lg font-semibold text-gold-300 mb-2">Equality and Human Rights Commission (EHRC)</h4>
                  <p className="text-white text-sm mb-2">
                    The EHRC is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) 
                    Accessibility Regulations 2018 (the 'accessibility regulations').
                  </p>
                  <p className="text-white text-sm">
                    Website: <a href="https://www.equalityhumanrights.com/" target="_blank" rel="noopener noreferrer" 
                               className="text-gold-300 hover:text-gold-200 underline">
                      equalityhumanrights.com
                    </a>
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
              This accessibility statement was last updated on {lastUpdated}.
            </strong>
          </p>
          <p className="text-parchment-400 text-xs">
            We review and update this statement regularly as we continue to improve our website's accessibility. 
            This statement will be updated as new features are added or accessibility improvements are made.
          </p>
        </div>
      </div>
    </main>
  )
}