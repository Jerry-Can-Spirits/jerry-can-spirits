import Link from 'next/link'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
import type { TradeResource } from '@/lib/trade-portal/resources'

interface Props {
  resource: TradeResource
}

export function ResourceCard({ resource }: Props) {
  const href =
    resource.kind === 'pdf'
      ? `/api/trade/resources/${encodeURIComponent(resource.slug)}`
      : resource.href
  const label = resource.kind === 'pdf' ? 'Download PDF' : 'Open guide'

  return (
    <article className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 flex flex-col gap-3">
      <h2 className="text-xl font-serif font-bold text-white">{resource.title}</h2>
      <p className="text-sm text-parchment-300 leading-relaxed grow">{resource.description}</p>
      <div>
        <Link href={href} className={PRIMARY_BUTTON} prefetch={false}>
          {label}
        </Link>
      </div>
    </article>
  )
}
