import { DELIVERY_PROMISE } from '@/lib/delivery'
import ChristmasCutoffLine from '@/components/ChristmasCutoffLine'

// The four reasons to trust the button. The words carry it: the glyphs that
// used to sit beside them went with the site's decorative icons. The IWSC
// tile is deliberately conditional: on the awarded products the medals sit
// beside the button with the judges' note, and VOICE is explicit that an
// award stated once is a fact and three times is hype, so those pages carry
// the charity commitment in that slot instead.
function tiles(showIwsc: boolean): string[] {
  return [
    'Veteran owned',
    DELIVERY_PROMISE,
    showIwsc ? 'IWSC 2026 medals' : '5% of profits to forces charities',
    'Reply and a founder answers',
  ]
}

export default function TrustStrip({ showIwsc }: { showIwsc: boolean }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Why buy from us">
      {tiles(showIwsc).map((label) => (
        <li key={label} className="flex items-center rounded-lg border border-gold-500/15 bg-jerry-green-900/40 px-3 py-2.5 text-sm leading-snug text-parchment-200">
          {label}
        </li>
      ))}
      {/* December only, and only once the date is set in lib/delivery.ts. */}
      <li className="col-span-2 sm:col-span-4 empty:hidden">
        <ChristmasCutoffLine
          surface="product"
          className="flex items-center rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2.5 text-sm font-semibold leading-snug text-gold-300"
        />
      </li>
    </ul>
  )
}
