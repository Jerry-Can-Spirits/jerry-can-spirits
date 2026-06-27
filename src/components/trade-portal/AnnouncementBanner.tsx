import Link from 'next/link'
import { TRADE_ANNOUNCEMENT } from '@/config/trade-announcement'

export function AnnouncementBanner() {
  const ann = TRADE_ANNOUNCEMENT
  if (!ann) return null

  return (
    <div role="status" className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-emerald-700 text-sm font-semibold uppercase tracking-widest mb-1">
            {ann.title}
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed">{ann.body}</p>
        </div>
        {ann.ctaLabel && ann.ctaUrl && (
          <Link
            href={ann.ctaUrl}
            className="inline-flex items-center text-emerald-700 hover:text-emerald-600 text-sm font-medium underline underline-offset-4 whitespace-nowrap"
          >
            {ann.ctaLabel}
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        )}
      </div>
    </div>
  )
}
