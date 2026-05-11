'use client'

import { useRef, useState } from 'react'
import type { UploadedFileRef } from './types'

interface FileUploadProps {
  id: string
  label: string
  required?: boolean
  value: UploadedFileRef | null
  onChange: (value: UploadedFileRef | null) => void
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const MAX_BYTES = 5 * 1024 * 1024

export function FileUpload({ id, label, required, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSelect = async (file: File | null) => {
    setError(null)
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('File exceeds 5MB limit.')
      return
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only PDF, JPG, or PNG files are accepted.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/trade-application/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed.' })) as { error?: string }
        setError(data.error ?? 'Upload failed.')
        return
      }
      const data = await res.json() as UploadedFileRef
      onChange(data)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-parchment-200 mb-2">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        aria-required={required ? 'true' : undefined}
        className="sr-only"
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : value ? 'Replace file' : 'Choose file'}
        </button>
        {value && (
          <span className="text-sm text-parchment-200 truncate" title={value.filename}>
            {value.filename}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-parchment-400">PDF, JPG, or PNG. Max 5MB.</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}
