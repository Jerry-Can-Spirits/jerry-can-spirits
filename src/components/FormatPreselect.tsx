'use client'

import { useEffect } from 'react'

// `?format=gift-boxed` on a rum product page marks that chip and scrolls it
// into view, so an ad can land on the bottle page with the format it sold
// already picked out. The chips are links to sibling product pages, so this is
// as far as preselection can go without changing what the page sells. Read
// from window rather than useSearchParams, which would make the cached page
// render per request.
export default function FormatPreselect({ handles }: { handles: string[] }) {
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('format')
    if (!wanted) return
    const handle = handles.find((h) => h === wanted || h.endsWith(`-${wanted}`))
    if (!handle) return
    const chip = document.querySelector<HTMLAnchorElement>(`[data-format="${handle}"]`)
    if (!chip) return
    chip.classList.add('border-gold-400', 'ring-2', 'ring-gold-400/60')
    chip.scrollIntoView({ block: 'center', behavior: 'smooth' })
    chip.focus({ preventScroll: true })
  }, [handles])
  return null
}
