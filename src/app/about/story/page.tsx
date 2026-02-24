import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import ScrollReveal from '@/components/ScrollReveal'

// Article schema for the story page
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Our Story - How Two Veterans Built a British Rum Brand',
  description: 'Jerry Can Spirits — veteran-owned military rum by Royal Signals veterans. From Arctic deployments to premium small-batch spiced rum in Wales.',
  url: 'https://jerrycanspirits.co.uk/about/story/',
  image: 'https://jerrycanspirits.co.uk/images/hero/Trail_Hero.webp',
  author: {
    '@type': 'Organization',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
    logo: {
      '@type': 'ImageObject',
      url: 'https://jerrycanspirits.co.uk/images/Logo.webp',
    },
  },
  datePublished: '2024-01-01',
  dateModified: '2025-01-01',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://jerrycanspirits.co.uk/about/story/',
  },
}

export const metadata: Metadata = {
  title: "Our Story - Two Veterans Building a Rum Brand",
  description: "Jerry Can Spirits — veteran-owned military rum by Royal Signals veterans. From Arctic deployments to premium small-batch spiced rum in Wales.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/story/',
  },
  openGraph: {
    title: "Our Story | Jerry Can Spirits®",
    description: "Jerry Can Spirits — veteran-owned military rum by Royal Signals veterans. From Arctic deployments to premium small-batch spiced rum in Wales.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function OurStory() {
  return (
    <main className="min-h-screen py-20">
      <StructuredData data={articleSchema} id="story-article-schema" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'About', href: '/about/story' },
            { label: 'Our Story' },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12 relative">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Our Story
              </span>
            </div>

            {/* Story Hero Image */}
            <div className="relative w-full max-w-2xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden border border-gold-500/20 mb-8 shadow-2xl">
              <Image
                src="/images/hero/Trail_Hero.webp"
                alt="Jerry Can Spirits - Veteran-owned British rum with military heritage"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/60 to-transparent" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Forged by the Fire
            <br />
            <span className="text-gold-300">of Experience</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Shaped by years of military service, driven by a desire for adventure – and a determination to craft rum without compromise. A veteran-owned rum brand engineered with purpose, made with integrity, for people who live life on their own terms.
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

        {/* Section 1: From the Trenches to Adventure */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              From the Trenches to the Adventure
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              Service with the Royal Corps of Signals took us to places where your equipment really gets put to the test. That military background shapes everything about how we make rum.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
            {/* Story Content */}
            <div className="space-y-6">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  Lessons from Service
                </h3>
                <p className="text-parchment-300 leading-relaxed mb-4">
                  I served with the Royal Corps of Signals. Deployments to the Arctic and desert outposts – places where your equipment really gets put to the test. We learned to put our faith in gear that gets the job done, not in the likes of flashy new kit. The most reliable stuff is the unflashy stuff.
                </p>
                <p className="text-parchment-300 leading-relaxed">
                  Life after the military was different for all of us. We all went on to do our own thing, but we retained that same basic understanding. A piece of kit that works, a design that&apos;s functional, a product that&apos;s reliable – these are non-negotiables. Whether you&apos;re on some grand expedition or just getting through a tough Tuesday, that&apos;s what matters.
                </p>
              </div>
            </div>

            {/* Visual Element */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 sm:p-8 border border-gold-500/20">
              <div className="relative w-full h-48 sm:h-64 lg:h-80 rounded-lg overflow-hidden border border-gold-500/20 mb-6">
                <Image
                  src="/images/hero/Our_Story_Hero.webp"
                  alt="Jerry Can Spirits - Military heritage"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/40 to-transparent" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">We learned what reliable means with service</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">That&apos;s tested in the fire of adventure</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">Function over form, always, is our way</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
                  <p className="text-parchment-300 text-sm">Engineering perfection for the modern explorer</p>
                </div>
              </div>
            </div>
          </div>

          {/* The Idea That Wouldn't Die */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-bold text-white mb-4">
                The Idea That Wouldn&apos;t Die
              </h3>
              <p className="text-parchment-300 text-lg italic">
                &quot;Let&apos;s make our own rum...&quot;
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <p className="text-white text-lg leading-relaxed text-center mb-8">
                That was the phrase that kept coming up, over and over, every time we got together to chat. Every shared experience, every conversation, every passing minute. There was this nagging feeling that someone ought to have a go at engineering rum, with the same kind of precision we brought to everything else. That we could leave the pirates and palm trees behind and craft something that was truly worth drinking.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <ScrollReveal delay={0}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gold-400 text-xl font-bold">1</span>
                    </div>
                    <p className="text-gold-300 font-semibold mb-2">What We&apos;re All About</p>
                    <p className="text-parchment-300 text-sm">Designing rum with purpose and integrity to begin with</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={1}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gold-400 text-xl font-bold">2</span>
                    </div>
                    <p className="text-gold-300 font-semibold mb-2">Our Mission in Life</p>
                    <p className="text-parchment-300 text-sm">Crafting spirits that are right for the modern explorer</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={2}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gold-400 text-xl font-bold">3</span>
                    </div>
                    <p className="text-gold-300 font-semibold mb-2">Our Slogan</p>
                    <p className="text-parchment-300 text-sm">&quot;Rum for people who actually do things&quot;</p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Turning Dreams into Reality */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Turning Dreams into Reality
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              The point at which we stopped just dreaming about this and started actually doing it – with a bit of purpose to boot.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-white mb-3">
                  When Talk Turns to Action
                </h3>
                <p className="text-parchment-300">
                  We&apos;d been talking about this for years, all of us. Then one day, it just clicked. If we really believed we could do something better, why were we still just talking about it? There wasn&apos;t a single eureka moment – just a growing realisation that we needed to stop jawing and get on with it.
                </p>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-white mb-3">
                  Facing the Music
                </h3>
                <p className="text-parchment-300">
                  We knew it wouldn&apos;t be easy. We all had other lives, different careers. But that shared vision, that idea that just wouldn&apos;t quit. It kept us going.
                </p>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-white mb-3">
                  Taking the Leap
                </h3>
                <p className="text-parchment-300">
                  &quot;Right, let&apos;s bloody well do it.&quot; Not some grand business plan – just a simple decision to take a chance and see where it takes us. We were going to make rum – the right way. Together.
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
                  &quot;The biggest risk is maybe not taking any risks... in a world where things are changing fast, if the only strategy that is bound to fail is dusting off the old playbook and sticking with it, then taking risks is the only thing that makes any sense.&quot;
                </p>
                <p className="text-gold-300 text-sm">
                  The mindset that finally gave us a nudge in the right direction
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Section 3: Building Something from Scratch */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Building Something from Scratch
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              The gritty reality of bootstrapping a business yourself: stuck in a home office, learning as you go, and somehow building something you can be proud of.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* The Hard Bits */}
            <ScrollReveal delay={0}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 h-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">The Hard Bits</h3>
              </div>

              <ul className="space-y-3 text-parchment-300 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Funding entirely out of our own pockets – no safety net, no way out</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Figuring out complex regulations on the fly – trial and error all the way</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Building a whole business from the ground up, solo</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Finding reliable suppliers and partners when nobody knows who you are</span>
                </li>
              </ul>
            </div>

            </ScrollReveal>

            {/* The Reality Check */}
            <ScrollReveal delay={1}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 h-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">The Reality Check</h3>
              </div>

              <div className="space-y-3">
                <p className="text-parchment-300 text-sm text-center italic mb-4">
                  &quot;This isn&apos;t some corporation with a team the size of a small army behind it. This is just us, in our home office, trying to build something real.&quot;
                </p>
                <div className="pt-4 space-y-2">
                  <p className="text-gold-300 text-sm">• Learning the regulations on a daily basis – and loving the challenge</p>
                  <p className="text-gold-300 text-sm">• Our home office is the real HQ – it&apos;s where the magic happens</p>
                  <p className="text-gold-300 text-sm">• Quality is the one thing we can&apos;t compromise on</p>
                </div>
              </div>
            </div>

            </ScrollReveal>

            {/* The School of Hard Knocks */}
            <ScrollReveal delay={2}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 h-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">The School of Hard Knocks</h3>
              </div>

              <ul className="space-y-3 text-parchment-300 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Every obstacle is a chance to learn something new</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Expedition-grade standards for our business – no cutting corners</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Building relationships one conversation at a time – they&apos;re everything</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Quality doesn&apos;t need a big budget to deliver</span>
                </li>
              </ul>
            </div>
            </ScrollReveal>
          </div>

          {/* David vs the Goliaths */}
          <ScrollReveal>
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
            <h3 className="text-2xl font-serif font-bold text-white mb-6">
              David vs the Goliaths
            </h3>
            <p className="text-lg text-parchment-300 leading-relaxed max-w-4xl mx-auto mb-6">
              We&apos;re not trying to compete with the marketing budgets of massive corporations with teams of marketing gurus. We&apos;re competing on authenticity, on care, on the kind of attention to detail that only comes when you genuinely care about every single thing you do. When you&apos;re living off your own savings, when you&apos;re figuring out regulations as you go, when you&apos;re building every single relationship from scratch, you simply can&apos;t afford to cut corners. Read more about <Link href="/ethos/" className="text-gold-300 hover:text-gold-400 underline">our values</Link>.
            </p>
            <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider">
              Small Team. Big Dreams. No Compromise. Because We Can&apos;t Afford to.
            </div>
          </div>
          </ScrollReveal>
        </section>

        {/* Section 4: The Jerry Can Promise */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              The Jerry Can Promise
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              It&apos;s not just a name, it&apos;s our personal guarantee that we&apos;ll be there when you need us most.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 sm:p-8 border border-gold-500/20 mb-8">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  How Did &quot;Jerry Can&quot; Come About?
                </h3>
                <p className="text-parchment-300 leading-relaxed mb-4">
                  The jerry can wasn&apos;t designed to win awards for looks – it was engineered to be reliable. As a team born of the service industry, we totally get that. Function over form, purpose over pretence.
                </p>
                <p className="text-parchment-300 leading-relaxed">
                  Jerry Can Spirits is built on the same principles. When you need a drink that delivers on character and quality without compromise, that&apos;s exactly what we&apos;re engineered to do. We&apos;re rum with purpose, with integrity.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20">
                  <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-400 font-bold">R</span>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold">Reliable</p>
                    <p className="text-parchment-300 text-sm">We&apos;ll be there when you need us</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20">
                  <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-400 font-bold">D</span>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold">Dependable</p>
                    <p className="text-parchment-300 text-sm">Built to last, designed to perform</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20">
                  <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-400 font-bold">P</span>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold">Purpose</p>
                    <p className="text-parchment-300 text-sm">Every single thing we make has a purpose – and we&apos;re proud of it</p>
                  </div>
                </div>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 mt-8">
                <h4 className="text-xl font-serif font-bold text-white mb-4">
                  Still Good, Still Unchanged
                </h4>
                <p className="text-parchment-300 leading-relaxed mb-4">
                  Designed in 1937. Still up to NATO standards today. Still the go-to choice for overlanders trekking across the Sahara, sailors navigating the Atlantic, and aid workers in some of the most remote areas of the world. 88 years without a redesign and we&apos;re not done yet – when you get it right, you don&apos;t need a new version.
                </p>
                <p className="text-gold-300 font-semibold">
                  That&apos;s the philosophy behind every single bottle we craft.
                </p>
              </div>
            </div>

            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-8">
                <div className="mx-auto mb-6 max-w-md">
                  <Image
                    src="/images/JerryCan_OakTree.webp"
                    alt="Jerry Can beside oak tree - engineered for reliability"
                    width={512}
                    height={512}
                    className="rounded-lg"
                    sizes="(max-width: 640px) 100vw, 512px"
                  />
                </div>
              </div>

              <blockquote className="text-center">
                <p className="text-lg text-white italic leading-relaxed mb-6">
                  &quot;Every bottle we craft carries this promise: when you reach for Jerry Can Spirits, you&apos;re reaching for something you can depend on. A quality that you can trust. A flavour that delivers.&quot;
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
              Where we&apos;re headed: from small home office dreams to becoming one of the UK&apos;s top spirits brands.
            </p>
          </div>

          <div className="space-y-16">
            {/* Current Status */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  Where We Are Currently
                </h3>
                <p className="text-parchment-300">
                  Still tweaking our inaugural rum, still learning, still building. We&apos;re not yet turning a profit, but we&apos;re getting there.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-serif font-bold text-gold-300 mb-4">Current Focus</h4>
                  <ul className="space-y-2 text-parchment-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Perfecting our first rum – it&apos;s a work in progress</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Building quality relationships – they&apos;re everything</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Setting up the foundations for our brand – this is hard work</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gold-400 rounded-full"></span>
                      <span>Learning every day – this is a business, after all</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-serif font-bold text-gold-300 mb-4">What We Know So Far</h4>
                  <ul className="space-y-2 text-parchment-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Quality can&apos;t be compromised</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Relationships are everything – they&apos;re worth more than any budget</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Authenticity has a way of resonating with people</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>We&apos;re just getting started – and we&apos;re excited</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Future Vision */}
            <div className="grid lg:grid-cols-3 gap-8">
              <ScrollReveal delay={0}>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center h-full">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold-400 text-xl font-bold">5Y</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-3">5-Year Vision</h4>
                <ul className="space-y-2 text-parchment-300 text-sm text-left">
                  <li>• Be one of the top spirits brands in the UK</li>
                  <li>• Have a range of world class rums on the market</li>
                  <li>• Have a strong retail presence – we want to be seen in the right places</li>
                  <li>• Have a loyal customer community – people who love what we do</li>
                </ul>
              </div>

              </ScrollReveal>
              <ScrollReveal delay={1}>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center h-full">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold-400 text-xl font-bold">10Y</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-3">10-Year Dream</h4>
                <ul className="space-y-2 text-parchment-300 text-sm text-left">
                  <li>• Own our own distillery – this is the ultimate goal</li>
                  <li>• Have a full range of spirits on offer – we want to be a one-stop shop</li>
                  <li>• Be known internationally – we want to be part of the big league</li>
                  <li>• Be sustainable – we don&apos;t want to be a burden on the environment</li>
                </ul>
              </div>

              </ScrollReveal>
              <ScrollReveal delay={2}>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center h-full">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-3">The Legacy</h4>
                <ul className="space-y-2 text-parchment-300 text-sm text-left">
                  <li>• We proved that small can beat big</li>
                  <li>• Quality is always the top priority</li>
                  <li>• We&apos;ve got a real story to tell – one that people will listen to</li>
                  <li>• We&apos;ve got our own team who&apos;s made this all possible</li>
                </ul>
              </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* FAQ Section with Schema */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              Common questions about Jerry Can Spirits and our story.
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <ScrollReveal>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">Who owns Jerry Can Spirits?</h3>
              <p className="text-parchment-300">
                Jerry Can Spirits is run by <Link href="/about/team/dan-freeman/" className="text-gold-300 hover:text-gold-400 underline">Dan</Link> and <Link href="/about/team/rhys-williams/" className="text-gold-300 hover:text-gold-400 underline">Rhys</Link>, who both served in the Royal Corps of Signals. We&apos;re self-funded and doing everything ourselves – learning as we go, making mistakes, and figuring it out along the way.
              </p>
            </div>

            </ScrollReveal>
            <ScrollReveal delay={1}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">Is Jerry Can Spirits veteran owned?</h3>
              <p className="text-parchment-300">
                Yes, we&apos;re British veteran owned. We both served in the Royal Corps of Signals before getting into spirits. The military taught us to appreciate kit that just works – nothing flashy, just reliable. That mindset stuck with us. Meet <Link href="/about/team/" className="text-gold-300 hover:text-gold-400 underline">the team</Link>.
              </p>
            </div>

            </ScrollReveal>
            <ScrollReveal delay={2}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">Where is Jerry Can Spirits based?</h3>
              <p className="text-parchment-300">
                We&apos;re based in the UK. It&apos;s a home-office operation – nothing glamorous, just us working away. Our <Link href="/shop/product/expedition-spiced-rum/" className="text-gold-300 hover:text-gold-400 underline">Expedition Spiced Rum</Link> is made with Caribbean rum and molasses from a Welsh brewery, blended at <Link href="/friends/" className="text-gold-300 hover:text-gold-400 underline">Spirit of Wales Distillery</Link> right here in Britain.
              </p>
            </div>

            </ScrollReveal>
            <ScrollReveal>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">What does the Jerry Can name mean?</h3>
              <p className="text-parchment-300">
                The jerry can is the ultimate &quot;function over form&quot; design – invented in 1937 and still used today because it just works. No frills, no nonsense. That&apos;s the approach we take with our rum. We&apos;re not trying to be flashy, we&apos;re trying to make something that&apos;s genuinely good.
              </p>
            </div>

            </ScrollReveal>
            <ScrollReveal delay={1}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">When was Jerry Can Spirits founded?</h3>
              <p className="text-parchment-300">
                We launched in 2025, though the idea had been kicking around for years. It started as one of those &quot;we should make our own rum&quot; conversations that kept coming up whenever we got together. Eventually we stopped just talking about it and actually had a go.
              </p>
            </div>

            </ScrollReveal>
            <ScrollReveal delay={2}>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">What makes Jerry Can Spirits different from other rum brands?</h3>
              <p className="text-parchment-300">
                Honestly? We&apos;re small and we&apos;re learning as we go. We don&apos;t have a big team or marketing department – it&apos;s just us, figuring out regulations, building relationships one at a time, and trying to make something we&apos;re proud of. When you&apos;re funding everything yourself, you care about every detail because you have to.
              </p>
            </div>
            </ScrollReveal>
          </div>

          {/* FAQ Schema Markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Who owns Jerry Can Spirits?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Jerry Can Spirits is run by Dan and Rhys, who both served in the Royal Corps of Signals. We're self-funded and doing everything ourselves – learning as we go, making mistakes, and figuring it out along the way."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is Jerry Can Spirits veteran owned?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, we're British veteran owned. We both served in the Royal Corps of Signals before getting into spirits. The military taught us to appreciate kit that just works – nothing flashy, just reliable. That mindset stuck with us."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Where is Jerry Can Spirits based?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "We're based in the UK. It's a home-office operation – nothing glamorous, just us working away. Our Expedition Spiced Rum is made with Caribbean rum and molasses from a Welsh brewery, blended right here in Britain."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What does the Jerry Can name mean?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The jerry can is the ultimate \"function over form\" design – invented in 1937 and still used today because it just works. No frills, no nonsense. That's the approach we take with our rum."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "When was Jerry Can Spirits founded?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "We launched in 2025, though the idea had been kicking around for years. It started as one of those \"we should make our own rum\" conversations that kept coming up whenever we got together. Eventually we stopped just talking about it and actually had a go."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What makes Jerry Can Spirits different from other rum brands?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "We're small and we're learning as we go. We don't have a big team or marketing department – it's just us, figuring out regulations, building relationships one at a time, and trying to make something we're proud of."
                    }
                  }
                ]
              })
            }}
          />
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Be Part of Our Story
            </h2>
            <p className="text-xl text-parchment-300 mb-8 max-w-3xl mx-auto">
              We&apos;re just getting started. Join us as we build genuinely good rum for people who expect quality and don&apos;t accept shortcuts. Having veterans behind the scenes means every bottle is made to a standard we&apos;d stake our name on.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/shop/drinks/"
                className="inline-flex items-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <span>Shop Our Rum</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <Link
                href="/sustainability/"
                className="inline-flex items-center space-x-2 bg-jerry-green-800 hover:bg-jerry-green-900 text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-jerry-green-800 hover:border-jerry-green-700 transition-all duration-300 transform hover:scale-105"
              >
                <span>Our Sustainability</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="mt-8 text-gold-300 text-sm">
              <p>Follow our journey from home office to distillery</p>
            </div>
          </div>
        </section>

      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
