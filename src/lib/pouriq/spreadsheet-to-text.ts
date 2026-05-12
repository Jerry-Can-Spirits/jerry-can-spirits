// Convert a CSV or XLSX File to plain text we can send to Claude via the
// existing /api/pouriq/import/extract text path. SheetJS is dynamically
// imported so the ~200KB bundle only loads on the import page.

const MAX_BYTES = 5 * 1024 * 1024

export async function spreadsheetToText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error('File exceeds 5MB limit')
  const lower = file.name.toLowerCase()

  if (lower.endsWith('.csv')) {
    const text = await file.text()
    if (!text.trim()) throw new Error('CSV file is empty')
    return text
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name]
      const csv = XLSX.utils.sheet_to_csv(sheet)
      return csv.trim() ? `--- Sheet: ${name} ---\n${csv}` : null
    }).filter((s): s is string => s !== null)
    if (sheets.length === 0) throw new Error('Spreadsheet has no readable rows')
    return sheets.join('\n\n')
  }

  throw new Error('Only .csv, .xls and .xlsx files are accepted')
}
