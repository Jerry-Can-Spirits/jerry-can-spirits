'use client'

import { useRef, useState } from 'react'

interface Props {
  onUploaded: (ticket: string, filename: string) => void
  disabled?: boolean
}

export function InvoiceUpload({ onUploaded, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/pouriq/invoices/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' })) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }
      const data = (await res.json()) as { ticket: string; filename: string }
      onUploaded(data.ticket, data.filename)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function handleChoose() {
    if (!disabled && !uploading) inputRef.current?.click()
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    void uploadFile(files[0])
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !uploading) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (disabled || uploading) return
        handleFiles(e.dataTransfer.files)
      }}
      className={`bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-10 border-2 border-dashed transition-colors ${
        dragOver ? 'border-gold-400 bg-jerry-green-800/60' : 'border-gold-500/30'
      }`}
    >
      <div className="text-center">
        <p className="text-lg text-parchment-100 mb-2">Drop a supplier invoice PDF here</p>
        <p className="text-sm text-parchment-400 mb-6">Or choose a file. Maximum 5MB.</p>
        <button
          type="button"
          onClick={handleChoose}
          disabled={disabled || uploading}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg"
        >
          {uploading ? 'Uploading…' : 'Choose a PDF'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  )
}
