// Extract plain text from a PDF buffer using pdf-parse.
// Used by /api/pouriq/import/extract when source = 'pdf'.

import 'server-only'
import pdfParse from 'pdf-parse'

export interface PdfExtractResult {
  text: string
  pageCount: number
}

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<PdfExtractResult> {
  const result = await pdfParse(Buffer.from(buffer))
  return {
    text: result.text ?? '',
    pageCount: result.numpages ?? 0,
  }
}
