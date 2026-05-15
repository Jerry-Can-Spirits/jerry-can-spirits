import { redirect } from 'next/navigation'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import type { PortableTextBlock } from 'next-sanity'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { HelpPortableText } from '@/components/pouriq/HelpPortableText'
import { client as sanityClient } from '@/sanity/lib/client'
import { tradeHelpQuery } from '@/sanity/queries'

export const dynamic = 'force-dynamic'

interface HelpSection {
  title: string
  body: PortableTextBlock[]
}

interface TradeHelpDoc {
  title: string
  intro: string
  sections: HelpSection[] | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function fetchTradeHelp(): Promise<TradeHelpDoc | null> {
  try {
    return await sanityClient.fetch<TradeHelpDoc | null>(tradeHelpQuery)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-help', phase: 'sanity-fetch' } })
    return null
  }
}

export default async function PourIqHelpPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const doc = await fetchTradeHelp()

  // Empty-state fallbacks for the content lifecycle.
  const title = doc?.title ?? 'Pour IQ™ help'
  const intro = doc?.intro ?? null
  const sections = doc?.sections ?? []

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← Pour IQ™</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-3">{title}</h1>
        {intro && <p className="text-parchment-300 text-base leading-relaxed mb-10">{intro}</p>}

        {sections.length === 0 ? (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <p className="text-parchment-300 leading-relaxed">
              We are writing this guide as Pour IQ™ evolves. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => {
              const id = `${slugify(section.title)}-${index}`
              const hasBody = Array.isArray(section.body) && section.body.length > 0
              return (
                <details
                  key={id}
                  id={id}
                  className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden"
                >
                  <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between gap-4 text-base font-serif font-bold text-white hover:bg-jerry-green-700/30 transition-colors">
                    <span>{section.title}</span>
                    <span
                      aria-hidden="true"
                      className="text-gold-400 text-lg transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-gold-500/10">
                    {hasBody ? (
                      <HelpPortableText value={section.body} />
                    ) : (
                      <p className="text-parchment-400 italic">This section is being written.</p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
