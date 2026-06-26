'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_GROUPS, isNavActive } from '@/lib/pouriq/nav'
import { AddImportMenu } from './AddImportMenu'

export function PourIqShell({ venueName, children }: { venueName: string; children: ReactNode }) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)

  const nav = (
    <nav aria-label="Pour IQ" className="px-3 py-4 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-widest text-parchment-500">{group.label}</div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href)
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setNavOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-gold-500/15 text-gold-100 font-semibold'
                        : 'text-parchment-300 hover:bg-jerry-green-700/40 hover:text-parchment-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gold-500/20 bg-jerry-green-900/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setNavOpen((o) => !o)}
            className="lg:hidden text-parchment-200 hover:text-white"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/trade/pouriq" className="flex items-baseline gap-2 min-w-0">
            <span className="text-gold-300 font-semibold uppercase tracking-widest text-sm whitespace-nowrap">Pour IQ&trade;</span>
            <span className="text-parchment-400 text-sm truncate">{venueName}</span>
          </Link>
        </div>
        <AddImportMenu />
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-56 shrink-0 border-r border-gold-500/15 min-h-[calc(100vh-57px)]">
          {nav}
        </aside>

        {navOpen && (
          <div className="lg:hidden fixed inset-0 z-30">
            <div className="absolute inset-0 bg-black/50" onClick={() => setNavOpen(false)} aria-hidden="true" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-jerry-green-900 border-r border-gold-500/20 overflow-y-auto">
              {nav}
            </aside>
          </div>
        )}

        <div id="main-content" className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
