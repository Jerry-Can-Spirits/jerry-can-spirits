import Link from 'next/link'

interface ActiveTileProps {
  variant: 'active'
  title: string
  description: string
  href: string
  ctaLabel: string
}

interface GreyedTileProps {
  variant: 'greyed'
  title: string
  description: string
  learnMoreHref: string
  unavailableNote: string
}

type TradeTileProps = ActiveTileProps | GreyedTileProps

export function TradeTile(props: TradeTileProps) {
  if (props.variant === 'active') {
    return (
      <Link
        href={props.href}
        className="block bg-jerry-green-800 rounded-xl p-6 border border-gold-500/20 hover:border-gold-400 transition-colors"
      >
        <h3 className="text-xl font-serif font-bold text-white mb-2">{props.title}</h3>
        <p className="text-parchment-300 text-sm leading-relaxed mb-6">{props.description}</p>
        <span className="inline-flex items-center text-gold-300 hover:text-gold-400 text-sm font-medium">
          {props.ctaLabel}
          <span aria-hidden="true" className="ml-2">→</span>
        </span>
      </Link>
    )
  }

  return (
    <div className="block bg-jerry-green-900 rounded-xl p-6 border border-gold-500/10">
      <h3 className="text-xl font-serif font-bold text-parchment-400 mb-2">{props.title}</h3>
      <p className="text-parchment-500 text-sm leading-relaxed mb-3">{props.description}</p>
      <p className="text-parchment-500 text-xs mb-6">{props.unavailableNote}</p>
      <Link
        href={props.learnMoreHref}
        className="inline-flex items-center text-gold-300/80 hover:text-gold-300 text-sm font-medium underline underline-offset-4"
      >
        Learn more
        <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </div>
  )
}
