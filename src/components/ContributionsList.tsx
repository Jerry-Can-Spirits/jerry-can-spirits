import type { CharityContribution, Charity } from '@/lib/d1'

interface ContributionsListProps {
  contributions: CharityContribution[]
  charities: Charity[]
}

export default function ContributionsList({ contributions, charities }: ContributionsListProps) {
  if (contributions.length === 0) return null

  // Group by year, preserving DESC order from SQL
  const byYear = contributions.reduce<Record<number, CharityContribution[]>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = []
    acc[c.year].push(c)
    return acc
  }, {})

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year}>
          <h3 className="text-xl font-serif font-bold text-white mb-4">{year}</h3>
          <div className="space-y-4">
            {byYear[year].map((contribution) => {
              const charity = charities.find((c) => c.id === contribution.charity_id)
              const charityName = charity?.name ?? contribution.charity_id
              const amount =
                contribution.amount_gbp !== null
                  ? contribution.amount_gbp.toLocaleString('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : 'Non-monetary contribution'

              return (
                <div
                  key={contribution.id}
                  className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-4"
                >
                  <p className="text-parchment-500 text-sm">{contribution.period_description}</p>
                  <p className="text-white font-medium mt-1">{charityName}</p>
                  <p className="text-gold-400 font-semibold mt-1">{amount}</p>
                  {contribution.notes && (
                    <p className="text-parchment-400 text-sm mt-2">{contribution.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
