'use client'

interface TickerStripProps {
  items: string[]
  className?: string
}

export default function TickerStrip({ items, className = '' }: TickerStripProps) {
  // Duplicate items for seamless loop
  const duplicated = [...items, ...items]

  return (
    <div
      className={`ticker-strip ${className}`}
      role="marquee"
      aria-live="off"
    >
      <div className="ticker-strip__track">
        {duplicated.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center whitespace-nowrap px-8 text-gold-300 font-semibold text-sm uppercase tracking-widest"
          >
            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full mr-8 flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
