import Link from 'next/link'
import { PrintButton } from './PrintButton'

interface Props {
  title: string
  eyebrow?: string
  subtitle?: string
  children: React.ReactNode
}

export function TradeSheetShell({ title, eyebrow, subtitle, children }: Props) {
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
          {/* print:block! overrides the global "header, footer { display: none }"
              rule in globals.css that hides site-level chrome. Without it, the
              card title disappears from print. */}
          <header className="mb-8 print:mb-4 print:block!">
            {eyebrow && (
              <p className="text-gold-300 text-xs uppercase tracking-widest mb-2 print:text-black">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white print:text-black mb-1">
              {title}
            </h1>
            {subtitle && <p className="text-parchment-300 print:text-black">{subtitle}</p>}
          </header>
          {children}
        </article>
      </div>
    </main>
  )
}

export function TradeSheetSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8 print:mb-5 print:break-inside-avoid">
      <h2 className="text-xs uppercase tracking-widest text-gold-300 print:text-black border-b border-gold-500/30 print:border-black/40 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function TradeSpecGrid({
  rows,
}: {
  rows: Array<{ label: string; value: string }>
}) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex justify-between border-b border-gold-500/15 print:border-black/30 py-1"
        >
          <dt className="text-parchment-400 print:text-black/70">{r.label}</dt>
          <dd className="text-parchment-100 print:text-black font-medium text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
