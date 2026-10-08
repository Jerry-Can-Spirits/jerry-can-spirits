import { useId } from 'react'

export interface ComparisonTableData {
  caption?: string
  headers?: string[]
  rows?: { cells?: string[] }[]
}

// One renderer for every comparison table: the guide's top-level
// comparisonTables field and the comparisonTable block inside rich text
// bodies. Cards on mobile, a real table from md up. Fields are optional
// because Studio validation does not bind API writes.
export default function ComparisonTable({ caption, headers = [], rows = [] }: ComparisonTableData) {
  const headingId = useId()

  if (headers.length === 0 || rows.length === 0) return null

  return (
    <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 overflow-hidden">
      {caption && (
        <h3 id={headingId} className="text-2xl font-serif font-bold text-gold-300 mb-6">
          {caption}
        </h3>
      )}

      <div className="md:hidden space-y-4">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="bg-jerry-green-800/30 rounded-lg p-4 border border-gold-500/10"
          >
            <h4 className="text-white font-semibold text-lg mb-3">
              {row.cells?.[0]}
            </h4>
            <dl className="space-y-2">
              {headers.slice(1).map((header, headerIndex) => (
                <div key={headerIndex} className="flex justify-between items-center gap-4 text-sm">
                  <dt className="text-gold-400">{header}</dt>
                  <dd className="text-parchment-300 text-right">{row.cells?.[headerIndex + 1]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" aria-labelledby={caption ? headingId : undefined}>
          <thead>
            <tr className="border-b border-gold-500/30">
              {headers.map((header, headerIndex) => (
                <th
                  key={headerIndex}
                  scope="col"
                  className="px-4 py-3 text-left text-gold-300 font-semibold text-sm uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gold-500/10 hover:bg-jerry-green-800/20 transition-colors"
              >
                {headers.map((_, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className="px-4 py-3 text-left font-semibold text-white"
                    >
                      {row.cells?.[0]}
                    </th>
                  ) : (
                    <td key={cellIndex} className="px-4 py-3 text-parchment-300">
                      {row.cells?.[cellIndex]}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
