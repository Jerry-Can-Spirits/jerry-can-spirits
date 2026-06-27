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
        className="block bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-600 transition-colors"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-2">{props.title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">{props.description}</p>
        <span className="inline-flex items-center text-emerald-700 text-sm font-medium">
          {props.ctaLabel}
          <span aria-hidden="true" className="ml-2">→</span>
        </span>
      </Link>
    )
  }

  return (
    <div className="block bg-slate-50 rounded-xl p-6 border border-slate-200">
      <h3 className="text-xl font-bold text-slate-500 mb-2">{props.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-3">{props.description}</p>
      <p className="text-slate-400 text-xs mb-6">{props.unavailableNote}</p>
      <Link
        href={props.learnMoreHref}
        className="inline-flex items-center text-emerald-700/80 hover:text-emerald-600 text-sm font-medium underline underline-offset-4"
      >
        Learn more
        <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </div>
  )
}
