import Link from 'next/link'
import { PrintButton } from './PrintButton'
import type { BartenderGuide as BartenderGuideData } from '@/lib/trade-portal/bartender-guides'

interface Props {
  guide: BartenderGuideData
  venueTitle: string
}

export function BartenderGuide({ guide, venueTitle }: Props) {
  return (
    <main className="min-h-screen bg-jerry-green-950 print:bg-white print:min-h-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 print:px-0 print:pt-0 print:pb-0 print:max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 print:hidden">
          <Link href="/trade/resources" className="text-sm text-parchment-400 hover:text-parchment-200">
            ← Trade resources
          </Link>
          <PrintButton />
        </div>

        <article className="text-parchment-100 print:text-black">
          <header className="mb-8 print:mb-4">
            <p className="text-gold-300 text-xs uppercase tracking-widest mb-2 print:text-black">
              Bartender&apos;s Guide
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white print:text-black mb-1">
              Expedition Spiced
            </h1>
            <p className="text-parchment-300 print:text-black">{venueTitle}. {guide.venue_label}.</p>
            <p className="text-parchment-400 text-sm mt-2 print:text-black">
              Caribbean soul, British craft. Veteran-owned.
            </p>
          </header>

          <Section title="What it is">
            <p className="leading-relaxed">{guide.what_it_is}</p>
          </Section>

          <Section title="How to serve it">
            <div className="space-y-5">
              {guide.serves.map((serve, idx) => (
                <div key={idx}>
                  <p className="text-xs uppercase tracking-widest text-gold-300 print:text-black mb-1">
                    {serve.heading}
                  </p>
                  <p className="font-serif text-lg text-white print:text-black mb-1">{serve.name}</p>
                  <p className="leading-relaxed">{serve.build}</p>
                  {serve.notes && (
                    <p className="text-sm text-parchment-300 print:text-black mt-1 italic">{serve.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Three things to remember">
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              {guide.three_things.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ol>
          </Section>

          <Section title="What to say">
            <div className="space-y-3">
              {guide.what_to_say.map((item, idx) => (
                <div key={idx}>
                  <p className="text-sm text-parchment-300 print:text-black mb-0.5">{item.scenario}</p>
                  <p className="leading-relaxed">{item.response}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="About the brand">
            <p className="leading-relaxed">{guide.about}</p>
          </Section>
        </article>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 print:mb-5">
      <h2 className="text-xs uppercase tracking-widest text-gold-300 print:text-black border-b border-gold-500/30 print:border-black/40 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}
