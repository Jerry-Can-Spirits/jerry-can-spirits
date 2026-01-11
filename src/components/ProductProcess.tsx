interface ProductProcessProps {
  process: string
}

export default function ProductProcess({ process }: ProductProcessProps) {
  return (
    <section className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gold-300 mb-4">
        Production Process
      </h2>
      <p className="text-parchment-200 leading-relaxed whitespace-pre-line">
        {process}
      </p>
    </section>
  )
}
