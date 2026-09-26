'use client'

import { useEffect, useState } from 'react'

export interface SectionNavItem {
  /** The id on the band's <section>, which carries scroll-mt so it lands below this strip. */
  id: string
  label: string
}

/**
 * A strip of links to a page's bands, pinned under the site header.
 *
 * The ingredient and equipment pages had a sticky contents rail in their
 * first band. Once the pages were cut into bands the rail's band was too
 * short for it to travel, so it stopped being sticky and a reader lost the
 * way around a long reference page (Dan, 25 Sep 2026: a sticky nav that
 * spans bands). This sits between the first band and the second and stays
 * put through all of them, on a phone as well as a desktop, which the rail
 * never did.
 *
 * The offset matches the fixed header plus the announcement bar, the same
 * calculation SiteChrome pads <main> by. Sections it points at carry
 * scroll-mt-36 so an anchor lands below the header and this strip together.
 */
export default function SectionNav({
  items,
  ariaLabel = 'On this page',
}: {
  items: SectionNavItem[]
  ariaLabel?: string
}) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    // The band nearest the top of the viewport, below the header and this
    // strip, is the one highlighted.
    const observer = new IntersectionObserver(
      (entries) => {
        const onscreen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (onscreen.length > 0) setActive(onscreen[0].target.id)
      },
      { rootMargin: '-144px 0px -60% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  // One destination is not a nav.
  if (items.length < 2) return null

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky z-30 band-dark border-y border-gold-500/20 print:hidden"
      style={{ top: 'calc(5rem + var(--announcement-height, 0px))' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex gap-2 overflow-x-auto py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:justify-center">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? 'true' : undefined}
                className={`inline-block px-4 py-1.5 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${
                  active === item.id
                    ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                    : 'bg-jerry-green-800/40 text-parchment-300 border-gold-500/20 hover:text-gold-300 hover:border-gold-500/40'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
