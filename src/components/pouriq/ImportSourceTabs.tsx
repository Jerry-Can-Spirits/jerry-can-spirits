'use client'

import { useRef, useState } from 'react'
import type { PreviewPayload } from '@/app/api/pouriq/import/extract/route'

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'
const tabClass = 'px-4 py-2 text-sm font-medium border-b-2 transition-colors'

interface Props {
  menuId: string
  onPreview: (payload: PreviewPayload) => void
}

export function ImportSourceTabs({ menuId, onPreview }: Props) {
  const [tab, setTab] = useState<'text' | 'pdf'>('text')
  const [text, setText] = useState('')
  const [pdfTicket, setPdfTicket] = useState<{ ticket: string; filename: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null) {
    setError(null)
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File exceeds 5MB limit'); return }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Only PDF files are accepted'); return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/pouriq/import/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' })) as { error?: string }
        setError(data.error ?? 'Upload failed')
        return
      }
      const data = await res.json() as { ticket: string; filename: string }
      setPdfTicket(data)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExtract() {
    setError(null)
    setSubmitting(true)
    try {
      const body = tab === 'text'
        ? { menuId, source: 'text', text }
        : { menuId, source: 'pdf', ticket: pdfTicket!.ticket }
      const res = await fetch('/api/pouriq/import/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Extraction failed' })) as { error?: string }
        setError(data.error ?? 'Extraction failed')
        return
      }
      const payload = await res.json() as PreviewPayload
      onPreview(payload)
    } finally {
      setSubmitting(false)
    }
  }

  const canExtract = tab === 'text' ? text.trim().length > 0 : pdfTicket !== null

  return (
    <div className="space-y-4">
      <div className="flex border-b border-gold-500/20">
        <button type="button" onClick={() => setTab('text')} className={`${tabClass} ${tab === 'text' ? 'border-gold-400 text-white' : 'border-transparent text-parchment-400 hover:text-parchment-200'}`}>
          Paste text
        </button>
        <button type="button" onClick={() => setTab('pdf')} className={`${tabClass} ${tab === 'pdf' ? 'border-gold-400 text-white' : 'border-transparent text-parchment-400 hover:text-parchment-200'}`}>
          Upload PDF
        </button>
      </div>

      {tab === 'text' ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className={`${inputClass} resize-vertical font-mono text-xs`}
            placeholder="Paste your menu here. Drink names, ingredients, and prices if you have them."
          />
        </div>
      ) : (
        <div>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-4 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm">
              {pdfTicket ? 'Replace PDF' : 'Choose PDF'}
            </button>
            {pdfTicket && <span className="text-sm text-parchment-200">{pdfTicket.filename}</span>}
          </div>
          <p className="mt-2 text-xs text-parchment-400">Max 5MB. PDF only.</p>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={handleExtract} disabled={!canExtract || submitting}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Reading menu…' : 'Extract drinks →'}
        </button>
      </div>
    </div>
  )
}
