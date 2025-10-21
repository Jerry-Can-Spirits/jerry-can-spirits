import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: "Armed Forces Covenant | Jerry Can Spirits - Supporting Our Military Community",
  description: "Jerry Can Spirits' commitment to the Armed Forces Covenant. Our pledge to support serving personnel, veterans, reservists, and their families through employment, commercial support, and community engagement.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function ArmedForcesCovenant() {
  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Our Commitment
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Armed Forces Covenant
          </h1>
          <p className="text-parchment-300 text-sm">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* AFC Banner */}
        <div className="mb-12 flex justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full">
            <Image
              src="/images/AFC_Banner__PNG_.png"
              alt="Armed Forces Covenant - We proudly support those who serve"
              width={800}
              height={200}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-none">
          <div className="space-y-8">

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Section 1: Principles of The Armed Forces Covenant
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                We, Jerry Can Spirits Ltd, will endeavour to uphold the key principles of the Armed Forces Covenant:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Members of the Armed Forces Community should not face disadvantages arising from their service in the provision of public and commercial services.</li>
                <li>In some circumstances special provision may be justified, especially for those who have given the most, such as the injured or bereaved.</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Section 2: Demonstrating our Commitment
              </h2>
              <p className="text-white mb-6 leading-relaxed">
                We recognise the contribution that Service personnel, reservists, veterans, the cadet movement and military families make to our organisation, our community and to the country. We will seek to uphold the principles of the Armed Forces Covenant by:
              </p>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                2.1 Promoting the Armed Forces:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Proudly sharing our founder's Royal Corps of Signals service history in our brand communications and marketing materials</li>
                <li>Using our platform to raise awareness of military service and sacrifice through authentic storytelling and content creation</li>
                <li>Participating in Armed Forces Day celebrations and military commemoration events</li>
                <li>Displaying Armed Forces Covenant signage prominently at our business premises and website</li>
                <li>Promoting military heritage as a core value rather than a marketing tool, demonstrating genuine respect for service</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Employment support to members of the Armed Forces Community:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Guaranteeing job interviews for all qualified serving personnel, reservists, veterans, and military spouses</li>
                <li>Offering flexible working arrangements to accommodate military commitments, deployments, and family needs</li>
                <li>Providing paid leave for reservists to attend training and deployment duties</li>
                <li>Actively seeking veteran-owned businesses as suppliers and service providers for our operations</li>
                <li>Creating apprenticeship and mentoring opportunities specifically for transitioning service personnel</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Communications, engagement and outreach:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Maintaining regular engagement with local military units, veteran organizations, and armed forces charities</li>
                <li>Publishing annual reports on our Armed Forces community support activities and charitable contributions</li>
                <li>Hosting networking events and tastings for military personnel and veterans</li>
                <li>Participating in military career fairs and transition workshops to support service leavers</li>
                <li>Collaborating with military welfare organizations to identify community needs and support opportunities</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Commercial:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Offering preferential pricing (minimum 10% discount) to serving personnel, veterans, reservists, and immediate military families on all products</li>
                <li>Providing special commemorative products and limited editions to mark military anniversaries and significant dates</li>
                <li>Ensuring our products and services are accessible to military families regardless of posting location through nationwide delivery</li>
                <li>Supporting military families during deployment with flexible payment terms and delivery arrangements</li>
                <li>Partnering with NAAFI and military welfare organisations for product availability on bases and military facilities</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Health:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Supporting mental health initiatives for veterans through our charitable partnerships, with particular focus on PTSD and transition support services</li>
                <li>Partnering with organisations providing adventure therapy and outdoor rehabilitation programmes for wounded, injured, and sick personnel</li>
                <li>Contributing to research and programmes addressing veteran-specific health challenges</li>
                <li>Promoting awareness of veteran mental health resources through our communications channels</li>
                <li>Supporting families of wounded, injured, and sick personnel through our charitable contributions</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Housing:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Supporting armed forces housing charities through our annual profit-sharing programme (5-15% of net profits)</li>
                <li>Supporting organisations providing emergency accommodation for veterans facing homelessness</li>
                <li>Contributing to programmes helping veterans access suitable housing in civilian communities</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Civic responsibilities:
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li>Participating in Remembrance Day commemorations and supporting local poppy appeals</li>
                <li>Supporting local military memorials and heritage preservation projects</li>
                <li>Engaging in local community initiatives that benefit military families</li>
                <li>Advocating for military community interests in local business networks and chambers of commerce</li>
                <li>Promoting civic awareness of military community contributions and needs</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-8 mb-4">
                Any additional commitment the organisation wishes to make:
              </h3>

              <h4 className="text-lg font-serif font-medium text-gold-300 mt-6 mb-3">
                Charitable Commitment:
              </h4>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Donating 5-15% of annual net profits to vetted armed forces charities, with transparent annual reporting of contributions and impact</li>
                <li>Prioritising organisations supporting veteran mental health, transition services, wounded personnel, and military family welfare</li>
                <li>Establishing long-term partnerships with 3-5 core military charities rather than dispersed one-off donations</li>
              </ul>

              <h4 className="text-lg font-serif font-medium text-gold-300 mt-6 mb-3">
                Supply Chain Support:
              </h4>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Actively seeking and prioritising veteran-owned suppliers and contractors where commercially viable</li>
                <li>Mentoring veteran entrepreneurs and small business owners in our supply chain</li>
                <li>Sharing business expertise and networks to support veteran-owned business development</li>
              </ul>

              <h4 className="text-lg font-serif font-medium text-gold-300 mt-6 mb-3">
                Product Development:
              </h4>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Ensuring all product development respects military heritage and avoids commercialising service or sacrifice</li>
                <li>Creating products that authentically celebrate military history and community rather than exploiting military imagery</li>
                <li>Consulting with military community members on product development to ensure appropriate and respectful approaches</li>
              </ul>

              <h4 className="text-lg font-serif font-medium text-gold-300 mt-6 mb-3">
                Operational Excellence:
              </h4>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li>Maintaining professional standards that honour military values of reliability, integrity, and service</li>
                <li>Implementing business practices that demonstrate the same precision and attention to detail expected in military operations</li>
                <li>Building a company culture that embodies military values whilst serving the broader community</li>
              </ul>

              <h4 className="text-lg font-serif font-medium text-gold-300 mt-6 mb-3">
                Community Leadership:
              </h4>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Advocating within the spirits industry for greater support of military community initiatives</li>
                <li>Sharing best practices with other businesses to encourage Armed Forces Covenant adoption</li>
                <li>Leading by example in demonstrating how authentic military heritage can drive positive social impact</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                2.2 Transparency and Accountability
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                We will publicise these commitments through our website ({' '}
                <a href="https://jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                  https://jerrycanspirits.co.uk
                </a>
                ), social media channels, product packaging, and marketing materials, setting out how we will seek to honour them and inviting feedback from the Armed Forces Community and our customers on how we are doing.
              </p>
              <p className="text-white leading-relaxed">
                We will publish an annual Armed Forces Community Impact Report detailing our progress against these pledges and welcome input from military community members on how we can better serve their needs.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Review and Amendment
              </h2>
              <p className="text-white leading-relaxed">
                These pledges will be reviewed annually and may be updated to reflect our growing capacity to support the Armed Forces Community as Jerry Can Spirits develops. Any amendments will be made in consultation with military community stakeholders to ensure continued relevance and effectiveness.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Accountability
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                We commit to transparency in our delivery of these pledges and welcome feedback from the Armed Forces Community through:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Our website contact form</li>
                <li>Social media channels</li>
                <li>Direct engagement at military community events</li>
              </ul>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm">
            <strong className="text-gold-300">
              This Armed Forces Covenant was established on {lastUpdated} and represents our unwavering commitment to supporting the military community.
            </strong>
          </p>
        </div>
      </div>
    </main>
  )
}