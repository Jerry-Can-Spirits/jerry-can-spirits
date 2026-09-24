import { DELIVERY_PROMISE } from '@/lib/delivery'

// The four reasons to trust the button, directly under it. Icons are inline
// so the strip costs no request. The IWSC tile is deliberately conditional:
// on the awarded products the medals sit a few lines above the button with
// the judges' note, and VOICE is explicit that an award stated once is a fact
// and three times is hype, so those pages carry the charity commitment in
// that slot instead.
type Tile = { icon: 'shield' | 'truck' | 'medal' | 'mail' | 'heart'; label: string }

function tiles(showIwsc: boolean): Tile[] {
  return [
    { icon: 'shield', label: 'Veteran owned' },
    { icon: 'truck', label: DELIVERY_PROMISE },
    showIwsc ? { icon: 'medal', label: 'IWSC 2026 medals' } : { icon: 'heart', label: '5% of profits to forces charities' },
    { icon: 'mail', label: 'Reply and a founder answers' },
  ]
}

function Icon({ name }: { name: Tile['icon'] }) {
  const common = { className: 'w-6 h-6 text-gold-400', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', 'aria-hidden': true }
  switch (name) {
    case 'shield':
      return <svg {...common}><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" /><path d="M9.5 12l1.8 1.8 3.4-3.6" /></svg>
    case 'truck':
      return <svg {...common}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>
    case 'medal':
      return <svg {...common}><circle cx="12" cy="14" r="5" /><path d="M8.5 9.5L6 3h4l2 4 2-4h4l-2.5 6.5" /></svg>
    case 'heart':
      return <svg {...common}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
    case 'mail':
      return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 8l9 6 9-6" /></svg>
  }
}

export default function TrustStrip({ showIwsc }: { showIwsc: boolean }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Why buy from us">
      {tiles(showIwsc).map((t) => (
        <li key={t.label} className="flex items-center gap-3 rounded-lg border border-gold-500/15 bg-jerry-green-900/40 px-3 py-2.5">
          <Icon name={t.icon} />
          <span className="text-sm leading-snug text-parchment-200">{t.label}</span>
        </li>
      ))}
    </ul>
  )
}
