'use client'

import { useRef, useState } from 'react'
import type { Recommendation } from '@/lib/pouriq/types'

const severityStyles: Record<Recommendation['severity'], string> = {
  info: 'border-gold-500/30 bg-jerry-green-800/40',
  warn: 'border-amber-500/40 bg-amber-900/20',
  action: 'border-red-500/40 bg-red-900/20',
}

export function RecommendationStream({ menuId }: { menuId: string }) {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  async function start() {
    if (startedRef.current) return
    startedRef.current = true
    setStreaming(true)
    setRecs([])
    setError(null)

    const res = await fetch(`/api/pouriq/recommend?menuId=${encodeURIComponent(menuId)}`, {
      method: 'POST',
    })
    if (!res.ok || !res.body) {
      setError('Could not generate recommendations. Try again.')
      setStreaming(false)
      startedRef.current = false
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const ev = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        const lines = ev.split('\n')
        const eventLine = lines.find((l) => l.startsWith('event: '))
        const dataLine = lines.find((l) => l.startsWith('data: '))
        if (!dataLine) continue
        if (eventLine === 'event: error') {
          try {
            const errObj = JSON.parse(dataLine.slice(6)) as { error?: string }
            setError(errObj.error ?? 'AI recommendation failed.')
          } catch {
            setError('AI recommendation failed.')
          }
          continue
        }
        const payload = dataLine.slice(6)
        if (payload === '[DONE]') continue
        try {
          const obj = JSON.parse(payload) as Recommendation
          setRecs((arr) => [...arr, obj])
        } catch { /* ignore malformed */ }
      }
    }
    setStreaming(false)
  }

  return (
    <div>
      {recs.length === 0 && !streaming && !error && (
        <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8 text-center">
          <p className="text-parchment-300 mb-4">Generate AI recommendations for this menu.</p>
          <button onClick={start} className="px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm">
            Analyse menu
          </button>
        </div>
      )}

      {streaming && recs.length === 0 && (
        <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-8 text-center">
          <p className="text-parchment-300">Reading your menu…</p>
        </div>
      )}

      {recs.length > 0 && (
        <div className="space-y-4">
          {recs.map((r, i) => (
            <article key={i} className={`border rounded-xl p-5 ${severityStyles[r.severity]}`}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest text-parchment-400">{r.category}</span>
                <h3 className="text-lg font-serif font-bold text-white">{r.title}</h3>
              </div>
              <p className="text-parchment-200 text-sm leading-relaxed">{r.body}</p>
              {r.suggested_change && (
                <div className="mt-3 text-sm text-parchment-300">
                  <strong className="text-parchment-100">Suggested: </strong>
                  {r.suggested_change.action.replace('_', ' ')}
                  {r.suggested_change.from && r.suggested_change.to && ` — ${r.suggested_change.from} → ${r.suggested_change.to}`}
                  <p className="text-xs text-parchment-400 mt-1">{r.suggested_change.impact_summary}</p>
                </div>
              )}
              {r.field_manual_reference && (
                <a href={r.field_manual_reference.url} className="inline-block mt-3 text-xs text-gold-300 hover:text-gold-200 underline">
                  See in the Field Manual
                </a>
              )}
            </article>
          ))}
          {streaming && <p className="text-parchment-400 text-sm">Generating more…</p>}
          {!streaming && (
            <button onClick={() => { startedRef.current = false; start() }} className="text-sm text-gold-300 hover:text-gold-200 underline">
              Re-run analysis
            </button>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
