'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import FirstPourSignup, { FIRST_POUR_SIGNED_UP_KEY } from './FirstPourSignup'

// The First Pour sign-up as a block above the footer on every page, alongside
// the Klaviyo pop-up (Dan, 8 Oct 2026, after Contact Coffee Co's inline
// "10% off" block). Same list, same form, and the pop-up's own live copy, so
// there is one offer everywhere. Not on the First Pour page (already a form)
// or the trade pages, and gone once this device has signed up.
const HIDDEN_PREFIXES = ['/first-pour', '/trade']

export default function FirstPourBlock() {
  const pathname = usePathname()
  const [signedUp, setSignedUp] = useState(false)

  useEffect(() => {
    try {
      setSignedUp(localStorage.getItem(FIRST_POUR_SIGNED_UP_KEY) === '1')
    } catch {
      // Storage blocked: keep showing the block.
    }
  }, [])

  if (signedUp || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <section aria-labelledby="first-pour-block-heading" className="band-light py-14 print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300 mb-3">First Pour</p>
          <h2 id="first-pour-block-heading" className="font-serif text-3xl font-bold text-white mb-4">
            The book that comes before the bottle.
          </h2>
          <p className="text-parchment-200 leading-relaxed">
            First Pour is our short companion to Expedition Spiced Rum. How it is built, how to drink it, and the
            first serves to try. Yours free, with 10% off your first order.
          </p>
        </div>
        <div className="max-w-md w-full md:justify-self-end">
          <FirstPourSignup />
        </div>
      </div>
    </section>
  )
}
