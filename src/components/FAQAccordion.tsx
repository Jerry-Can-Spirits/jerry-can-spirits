import type { ReactNode } from 'react'

export interface FAQAccordionItem {
  question: string
  /** Plain text, or a node where the answer carries links. */
  answer: ReactNode
}

// Every FAQ on the site, in one shape: a question you tap to open.
//
// Ten surfaces each had their own stack of question-and-answer cards, so a
// page of six answers was a page of scrolling, and the homepage was the only
// one you could skim (Dan, 24 Sep 2026: if that is the pattern it should be
// all of them). Native <details>, so it needs no JavaScript, works before
// hydration and is keyboard-operable for nothing.
//
// Collapsed answers stay in the DOM and are indexed normally, and every page
// that renders this still emits its own FAQPage structured data carrying the
// full answers, so nothing is hidden from search.
export default function FAQAccordion({
  items,
  columns = 1,
  headingLevel = 'h3',
}: {
  items: FAQAccordionItem[]
  /** Two columns from md up, for a long list that would otherwise run away. */
  columns?: 1 | 2
  /** h2 where the questions are the page's own sections, h3 inside one. */
  headingLevel?: 'h2' | 'h3'
}) {
  if (items.length === 0) return null
  const Heading = headingLevel

  return (
    <div
      className={
        columns === 2
          ? 'grid md:grid-cols-2 gap-4 md:gap-6 items-start'
          : 'space-y-3 sm:space-y-4'
      }
    >
      {items.map((item, i) => (
        <details
          key={i}
          className="group bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 open:border-gold-400/40"
        >
          <summary className="flex items-center justify-between gap-4 p-5 sm:p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-[44px]">
            <Heading className="text-lg font-serif font-bold text-gold-300">{item.question}</Heading>
            <svg
              className="w-5 h-5 shrink-0 text-gold-400 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-parchment-200 leading-relaxed">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  )
}
