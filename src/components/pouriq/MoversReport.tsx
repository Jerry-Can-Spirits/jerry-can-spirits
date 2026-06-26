import type { MoversReport as MoversReportData, MoverEntry } from '@/lib/pouriq/movers'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MoverList({ title, entries, dead = false }: { title: string; entries: MoverEntry[]; dead?: boolean }) {
  return (
    <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-4">
      <h3 className="text-xs uppercase tracking-widest text-gold-400 mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-parchment-500">None</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => (
            <li key={e.cocktail_id} className="text-sm">
              <span className="text-parchment-100">{e.name}</span>
              {dead ? (
                <span className="block text-xs text-parchment-400">
                  {e.last_sold ? `last sold ${formatDate(e.last_sold)}` : 'No sales recorded'}
                </span>
              ) : (
                <span className="text-parchment-400 ml-2">{e.units} sold</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function MoversReport({ report }: { report: MoversReportData }) {
  if (!report.has_sales) {
    return <p className="text-sm text-parchment-400">Add this period&rsquo;s sales to see your movers.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MoverList title="Top sellers" entries={report.top_sellers} />
      <MoverList title="Selling slowly" entries={report.slow_sellers} />
      <MoverList title="Not selling" entries={report.not_selling} dead />
    </div>
  )
}
