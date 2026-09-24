import type { ReactNode } from 'react'

// A row of cards that scrolls sideways on a phone and lays out as a grid from
// md up. No JavaScript: scroll-snap does the swiping, and a card shows the
// edge of the next one, which is the cue that there is more. Every homepage
// section with three or four cards uses this (Dan, 24 Sep 2026: a phone
// visitor was scrolling through every card of every section to reach the
// next one), so the swipe behaves the same way everywhere on the page.
//
// `cols` is the grid the row becomes on wider screens, e.g. "md:grid-cols-3".
// The negative margins let the row bleed to the screen edge on a phone
// inside the page's px-4 / sm:px-6 container.
export default function ScrollRow({
  items,
  cols,
  ariaLabel,
  itemClassName = '',
}: {
  items: ReactNode[]
  cols: string
  ariaLabel?: string
  itemClassName?: string
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className={`flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4 sm:-mx-6 sm:px-6 md:grid md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0 ${cols}`}
    >
      {items.map((item, i) => (
        <li key={i} className={`snap-start shrink-0 w-[80vw] sm:w-[60vw] md:w-auto ${itemClassName}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}
