import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: "Our Story | Jerry Can Spirits - Engineered for Adventure",
  description: "Discover how Jerry Can Spirits was born from a desire to create rum with purpose and integrity. From Royal Corps of Signals service to engineering small-batch rums for modern explorers.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function OurStory() {
  return (
    <main className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12 relative">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Our Story
              </span>
            </div>
            
            {/* Story Hero Visual Placeholder */}
            <div className="relative w-full max-w-2xl mx-auto h-64 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20 mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gold-300 mb-2">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-parchment-300 text-sm">
                  [Hero Image: Team photo or vintage expedition map with personal touches]
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Engineered for Purpose
            <br />
            <span className="text-gold-300">Built for Adventure</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed mb-8">
            The jerry can wasn't designed for beauty. It was engineered for absolute reliability. 
            We believe rum deserves the same respect. This is the story of modern explorers 
            who value function, character, and a damn good drink.
          </p>

          <div className="inline-flex items-center space-x-2 text-gold-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-wider">Our Journey</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section 1: The Team */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Forged by Experience
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              Shaped by service, driven by adventure, and committed to engineering rum with purpose and integrity for modern explorers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Story Content */}
            <div className="space-y-6">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  From Service to Adventure
                </h3>
                <p className="text-parchment-300 leading-relaxed mb-4">
                  Service with the Royal Corps of Signals took us everywhere - from Arctic deployments to desert outposts.
                  We learned what equipment you can trust when everything depends on it. Not the flashiest kit. The most reliable.
                </p>
                <p className="text-parchment-300 leading-relaxed">
                  We're civilians now. Different careers, different paths, but the same shared understanding: functional
                  design and unwavering reliability aren't just ideals - they're non-negotiables. Whether you're crossing
                  continents or conquering Tuesday, that's the standard that matters.
                </p>
              </div>
            </div>

            {/* Visual Element */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-parchment-300 text-sm mb-6">
                  [Team Photo Placeholder - Royal Corps of Signals veterans turned rum entrepreneurs]
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">Service taught us what reliable means</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">Adventure is where we prove it</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">Function over form, always</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">Engineering perfection for modern explorers</p>
                </div>
              </div>
            </div>
          </div>

          {/* The Recurring Conversation */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-bold text-white mb-4">
                "We should engineer our own rum..."
              </h3>
              <p className="text-parchment-300 text-lg italic">
                - Every meet-up, every conversation, every shared understanding of what rum could be
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-white text-lg leading-relaxed text-center mb-8">
                It started as an idea, evolved into a mission, then became our calling. 
                No matter where we were or what we were discussing, the conversation would always 
                drift back to the same place: "What if we engineered rum with the same precision 
                we brought to everything else? What if we left the pirates and palm trees behind?"
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold-400 text-xl font-bold">1</span>
                  </div>
                  <p className="text-gold-300 font-semibold mb-2">The Vision</p>
                  <p className="text-parchment-300 text-sm">Engineering rum with purpose and integrity</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold-400 text-xl font-bold">2</span>
                  </div>
                  <p className="text-gold-300 font-semibold mb-2">The Mission</p>
                  <p className="text-parchment-300 text-sm">Creating spirits for the modern explorer</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-gold-400 text-xl font-bold">3</span>
                  </div>
                  <p className="text-gold-300 font-semibold mb-2">The Commitment</p>
                  <p className="text-parchment-300 text-sm">"This is rum, engineered for adventure"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: From Talk to Action */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              From Vision to Engineering
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              The moment we stopped dreaming and started building something with purpose and integrity.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-white mb-3">
                  The Catalyst
                </h3>
                <p className="text-parchment-300">
                  There wasn't one dramatic moment, just the gradual realisation that we'd been 
                  talking about this for years. If we really believed in it, if we really thought 
                  we could do it better, then why were we still just talking?
                </p>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-white mb-3">
                  The Reality Check
                </h3>
                <p className="text-parchment-300">
                  We knew it wouldn't be easy. Most of the team had already left military service 
                  for different careers, different paths. But that shared vision, that persistent 
                  idea. It wouldn't let us go.
                </p>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-white mb-3">
                  The Commitment
                </h3>
                <p className="text-parchment-300">
                  "Right, let's pull the trigger." Not the most elegant business plan, 
                  but sometimes the best decisions are the simplest ones. We were going 
                  to make rum. Properly. Together.
                </p>
              </div>
            </div>

            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.58-5.84a14.927 14.927 0 015.84 2.58m-2.58 5.84a14.927 14.927 0 002.58 5.84" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  The Leap
                </h3>
              </div>
              
              <blockquote className="text-center">
                <p className="text-lg text-parchment-300 italic leading-relaxed mb-4">
                  "The biggest risk is not taking any risk... In a world that's changing quickly, 
                  the only strategy that is guaranteed to fail is not taking risks."
                </p>
                <p className="text-gold-300 text-sm">
                  The mindset that finally got us moving
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Section 3: Building Something Different */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Building Something Different
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              The reality of bootstrap entrepreneurship: one person in a home office, 
              learning the ropes, building something special.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* The Challenges */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">The Challenges</h3>
              </div>
              
              <ul className="space-y-3 text-parchment-300 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Funding entirely from our own pockets</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Learning complex regulations from scratch</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Setting up business infrastructure solo</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Finding reliable partners and suppliers</span>
                </li>
              </ul>
            </div>

            {/* The Reality */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">The Reality</h3>
              </div>
              
              <div className="space-y-3">
                <p className="text-parchment-300 text-sm text-center italic">
                  "This isn't some massive corporation with staggering teams behind it. This is us in our 
                  home offices, building something special."
                </p>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-gold-300 text-sm">
                    <span>📋</span>
                    <span>Learning regulations daily</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gold-300 text-sm">
                    <span>💻</span>
                    <span>Home office headquarters</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gold-300 text-sm">
                    <span>🎯</span>
                    <span>Quality over everything</span>
                  </div>
                </div>
              </div>
            </div>

            {/* The Learning */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">The Learning</h3>
              </div>
              
              <ul className="space-y-3 text-parchment-300 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Every obstacle is a learning opportunity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Expedition-grade standards applied to business</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Building relationships one conversation at a time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Quality doesn't require corporate budgets</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Personal Touch */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
            <h3 className="text-2xl font-serif font-bold text-white mb-6">
              David vs. Goliath
            </h3>
            <p className="text-lg text-parchment-300 leading-relaxed max-w-4xl mx-auto mb-6">
              We're not trying to compete with the marketing budgets of multinational corporations. 
              We're competing with authenticity, with care, with the kind of attention to detail 
              that only comes when every bottle matters personally. When you're funding it yourself, 
              when you're learning every regulation, when you're building every relationship, you don't 
              cut corners. You can't afford to.
            </p>
            <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider">
              Small Team. Big Dreams. No Compromises.
            </div>
          </div>
        </section>

        {/* Section 4: The Jerry Can Promise */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              The Jerry Can Promise
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              More than a name, it's our commitment to reliability when you need it most.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 mb-8">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  Why "Jerry Can"?
                </h3>
                <p className="text-parchment-300 leading-relaxed mb-4">
                  The jerry can wasn't designed for beauty. It was engineered for absolute reliability. 
                  As a team born of service, we understood this principle intimately. Function over form. 
                  Purpose over pretense.
                </p>
                <p className="text-parchment-300 leading-relaxed">
                  Jerry Can Spirits embodies this same philosophy. When you need a drink that delivers 
                  character and quality without compromise, we're engineered to be there. 
                  This is rum with purpose and integrity.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20">
                  <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-400 font-bold">R</span>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold">Reliability</p>
                    <p className="text-parchment-300 text-sm">Always there when you need it</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20">
                  <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-400 font-bold">D</span>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold">Dependability</p>
                    <p className="text-parchment-300 text-sm">Built to last, designed to perform</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20">
                  <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-400 font-bold">P</span>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold">Purpose</p>
                    <p className="text-parchment-300 text-sm">Everything we make serves a purpose</p>
                  </div>
                </div>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 mt-8">
                <h4 className="text-xl font-serif font-bold text-white mb-4">
                  Still Essential, Still Unchanged
                </h4>
                <p className="text-parchment-300 leading-relaxed mb-4">
                  Designed in 1937. Still NATO standard today. Still the choice of overlanders crossing the Sahara,
                  sailors navigating the Atlantic, aid workers in the remotest regions. 88 years without a redesign
                  because when you engineer something perfectly, you don't need version 2.0.
                </p>
                <p className="text-gold-300 font-semibold">
                  That's the philosophy behind every bottle we craft.
                </p>
              </div>
            </div>

            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-8">
                <div className="mx-auto mb-6 max-w-md">
                  <Image
                    src="/images/JerryCan_OakTree.webp"
                    alt="Jerry Can beside oak tree - engineered for adventure"
                    width={512}
                    height={512}
                    className="rounded-lg"
                  />
                </div>
              </div>
              
              <blockquote className="text-center">
                <p className="text-lg text-white italic leading-relaxed mb-6">
                  "Every bottle we craft carries this promise: when you reach for Jerry Can Spirits, 
                  you're reaching for something you can depend on. Quality you can trust. 
                  Flavour that delivers."
                </p>
                <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider">
                  Our Commitment to You
                </div>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Section 5: The Vision */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              The Vision
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              Where we're heading: from home office dreams to becoming one of the premier spirits brands in the UK.
            </p>
          </div>

          <div className="space-y-16">
            {/* Current Status */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  Where We Are Now
                </h3>
                <p className="text-parchment-300">
                  Still refining our first product, still learning, still building. 
                  We're not making money yet, but we're making progress.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-serif font-bold text-gold-300 mb-4">Current Focus</h4>
                  <ul className="space-y-2 text-parchment-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Perfecting our inaugural rum</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Building quality partnerships</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Establishing brand foundations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Learning every day</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-serif font-bold text-gold-300 mb-4">What We Know</h4>
                  <ul className="space-y-2 text-parchment-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Quality can't be compromised</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Relationships matter more than budgets</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Authenticity resonates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>We're just getting started</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Future Vision */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold-400 text-xl font-bold">5Y</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-3">5-Year Vision</h4>
                <ul className="space-y-2 text-parchment-300 text-sm text-left">
                  <li>• Premier UK spirits brand</li>
                  <li>• Range of exceptional rums</li>
                  <li>• Established retail presence</li>
                  <li>• Strong customer community</li>
                </ul>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold-400 text-xl font-bold">10Y</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-3">10-Year Dream</h4>
                <ul className="space-y-2 text-parchment-300 text-sm text-left">
                  <li>• Our own distillery</li>
                  <li>• Full spirits portfolio</li>
                  <li>• International recognition</li>
                  <li>• Sustainable operations</li>
                </ul>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-3">The Legacy</h4>
                <ul className="space-y-2 text-parchment-300 text-sm text-left">
                  <li>• Proved small can beat big</li>
                  <li>• Quality over everything</li>
                  <li>• Authentic brand story</li>
                  <li>• Team dreams realised</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Be Part of Our Story
            </h2>
            <p className="text-xl text-parchment-300 mb-8 max-w-3xl mx-auto">
              We're just getting started. Join the expedition as we meticulously craft 
              small-batch rums for the modern explorer: those who value function, character, and a damn good drink.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/#signup"
                className="inline-flex items-center space-x-2 bg-jerry-green-800 hover:bg-jerry-green-900 text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-jerry-green-800 hover:border-jerry-green-700 transition-all duration-300 transform hover:scale-105"
              >
                <span>Join the Expedition</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              
              <a 
                href="/ethos"
                className="inline-flex items-center space-x-2 bg-transparent hover:bg-jerry-green-800/40 text-gold-300 hover:text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-gold-500/40 hover:border-gold-400 transition-all duration-300"
              >
                <span>Discover Our Ethos</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
            
            <div className="mt-8 text-gold-300 text-sm">
              <p>Follow our journey from home office to distillery</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}