'use client'

import { useEffect, useState } from 'react'
import type { ExtractedHeading } from '@/lib/sanity-text'

interface ReferenceContentsProps {
  items: ExtractedHeading[]
}

/**
 * The contents list at the top of the sticky rail on ingredient and equipment
 * pages.
 *
 * The rail is pinned beside a body that now runs to four headed sections plus
 * tips and questions, and it carried only a price guide. This gives it
 * something worth pinning and gives the sections a way in.
 *
 * Hidden below lg: on a phone the rail is not a rail, it is a stack of cards
 * above the content, and a contents list there would be a second thing to
 * scroll past before reaching the first section.
 */
export default function ReferenceContents({ items }: ReferenceContentsProps) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.slug))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    // The bottom margin keeps the highlight on the section you are reading
    // rather than the one just entering at the foot of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const onscreen = entries.filter((e) => e.isIntersecting)
        if (onscreen.length > 0) setActive(onscreen[0].target.id)
      },
      { rootMargin: '-96px 0px -65% 0px' }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  // One entry is a label, not a contents list.
  if (items.length < 2) return null

  return (
    <nav
      aria-label="On this page"
      className="hidden lg:block bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
    >
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gold-300 mb-4">
        On this page
      </h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.slug}>
            <a
              href={`#${item.slug}`}
              aria-current={active === item.slug ? 'true' : undefined}
              className={`block border-l-2 pl-3 py-1 text-sm leading-snug transition-colors ${
                active === item.slug
                  ? 'border-gold-400 text-gold-300'
                  : 'border-gold-500/20 text-parchment-300 hover:text-parchment-200 hover:border-gold-500/50'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
