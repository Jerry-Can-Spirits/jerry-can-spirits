'use client'

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-sm px-4 py-2 border border-gold-500/40 text-gold-200 hover:bg-gold-500/10 hover:border-gold-400 rounded-lg transition-colors no-print"
    >
      Print report
    </button>
  )
}
