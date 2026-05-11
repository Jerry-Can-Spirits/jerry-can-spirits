// Magic-byte detection for the three allowed upload types.
// Header Content-Type is spoofable; the first few bytes of the file are not.

export type AllowedMime = 'application/pdf' | 'image/jpeg' | 'image/png'

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46] // %PDF
const JPEG_HEADER = [0xff, 0xd8, 0xff]
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function startsWith(buf: Uint8Array, prefix: number[]): boolean {
  if (buf.length < prefix.length) return false
  for (let i = 0; i < prefix.length; i++) {
    if (buf[i] !== prefix[i]) return false
  }
  return true
}

export function detectAllowedMime(buf: Uint8Array): AllowedMime | null {
  if (startsWith(buf, PDF_HEADER)) return 'application/pdf'
  if (startsWith(buf, JPEG_HEADER)) return 'image/jpeg'
  if (startsWith(buf, PNG_HEADER)) return 'image/png'
  return null
}

export function extensionForMime(mime: AllowedMime): string {
  switch (mime) {
    case 'application/pdf': return 'pdf'
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
  }
}
