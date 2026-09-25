import type { ReactNode } from 'react'

// The top of a section: an eyebrow, a heading, and a line of introduction.
//
// Five sections had the pill above their heading and four did not, and the
// heading and intro were sized slightly differently in each (Dan, 24 Sep
// 2026: if we have something like that above a title then it needs to be
// everywhere). Each had hand-rolled the same markup, so the pattern could
// only spread by being written out again.
//
// The eyebrow names the territory; VOICE asks the heading itself to be a
// statement rather than a label, which is why the heading carries the full
// stop and the eyebrow does not.
export default function SectionHeading({
  eyebrow,
  children,
  intro,
  id,
  align = 'center',
  as: Tag = 'h2',
}: {
  /** Short label above the heading. Every section on a page should have one or none. */
  eyebrow?: string
  children: ReactNode
  intro?: ReactNode
  /** Set when the section labels itself with aria-labelledby. */
  id?: string
  /** Left for a section whose heading sits in one column of a two-column layout. */
  align?: 'center' | 'left'
  /**
   * h1 for the heading that opens a page, so a page header shares this
   * markup instead of hand-rolling the same pill and title (every page did,
   * 51 copies at the 25 Sep 2026 count). Sized up to match the heroes.
   */
  as?: 'h1' | 'h2'
}) {
  const centred = align === 'center'
  const size = Tag === 'h1' ? 'text-4xl sm:text-6xl' : 'text-3xl md:text-4xl'
  return (
    <div className={centred ? 'text-center mb-10' : 'mb-6'}>
      {eyebrow && (
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            {eyebrow}
          </span>
        </div>
      )}

      <Tag id={id} className={`${size} font-serif font-bold text-white`}>
        {children}
      </Tag>

      {intro && (
        <p
          className={`mt-4 text-lg text-parchment-300 leading-relaxed${
            centred ? ' max-w-2xl mx-auto' : ''
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  )
}
