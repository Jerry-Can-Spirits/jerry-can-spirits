import Link from 'next/link'
import type { AttentionRow } from '@/lib/pouriq/attention'

export function AttentionPanel({ rows }: { rows: AttentionRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mb-8 rounded-xl border border-amber-400/40 bg-amber-500/10 p-5">
      <h2 className="text-xs uppercase tracking-widest text-amber-200/80 mb-3">Needs attention</h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.key}>
            <Link
              href={r.href}
              className="flex items-center justify-between gap-3 text-sm text-amber-100 hover:text-white transition-colors"
            >
              <span>{r.label}</span>
              <span aria-hidden className="font-semibold">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
