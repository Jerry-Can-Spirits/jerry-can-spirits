// Convert a CSV or XLSX File to plain text we can send to Claude via the
// existing /api/pouriq/import/extract text path. ExcelJS is dynamically
// imported so the bundle only loads on the import page.

const MAX_BYTES = 5 * 1024 * 1024

function csvEscape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    const obj = value as { text?: unknown; result?: unknown; richText?: Array<{ text?: string }>; hyperlink?: string }
    if (typeof obj.result !== 'undefined') return cellToString(obj.result)
    if (typeof obj.text === 'string') return obj.text
    if (Array.isArray(obj.richText)) return obj.richText.map((r) => r.text ?? '').join('')
    if (typeof obj.hyperlink === 'string') return obj.hyperlink
    return ''
  }
  return String(value)
}

export async function spreadsheetToText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error('File exceeds 5MB limit')
  const lower = file.name.toLowerCase()

  if (lower.endsWith('.csv')) {
    const text = await file.text()
    if (!text.trim()) throw new Error('CSV file is empty')
    return text
  }

  if (lower.endsWith('.xlsx')) {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    const sheets: string[] = []
    workbook.eachSheet((sheet) => {
      const rows: string[] = []
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const values: string[] = []
        const cellCount = sheet.columnCount || row.cellCount
        for (let i = 1; i <= cellCount; i++) {
          values.push(csvEscape(cellToString(row.getCell(i).value)))
        }
        // Trim trailing empty cells to keep the CSV tidy.
        while (values.length > 0 && values[values.length - 1] === '') values.pop()
        if (values.length > 0) rows.push(values.join(','))
      })
      if (rows.length > 0) sheets.push(`--- Sheet: ${sheet.name} ---\n${rows.join('\n')}`)
    })
    if (sheets.length === 0) throw new Error('Spreadsheet has no readable rows')
    return sheets.join('\n\n')
  }

  throw new Error('Only .csv and .xlsx files are accepted')
}
