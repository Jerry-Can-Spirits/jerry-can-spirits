'use client'

import { useState } from 'react'
import { SECONDARY_BUTTON_SM, PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
import { INPUT } from '@/lib/pouriq/ui'
import type { MenuSectionRow, ItemType } from '@/lib/pouriq/types'

interface Drink {
  id: string
  name: string
  description: string | null
  sale_price_p: number | null
  section_id: string | null
  item_type: ItemType
}

interface Props {
  menuId: string
  menuName: string
  sections: MenuSectionRow[]
  drinks: Drink[]
}

function formatMoney(p: number) { return `£${(p / 100).toFixed(2)}` }

export function MenuBuilder({ menuName, drinks }: Props) {
  const [title, setTitle] = useState(menuName)
  const [columns, setColumns] = useState<1 | 2>(1)
  const [showPrices, setShowPrices] = useState(true)
  const [showDescriptions, setShowDescriptions] = useState(true)

  return (
    <>
      {/* Controls — never printed */}
      <div className="no-print mb-8 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <label htmlFor="menu-title" className="block text-xs font-medium text-slate-700 mb-2">Menu title</label>
          <input
            id="menu-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-700">Layout:</span>
            <button type="button" onClick={() => setColumns(1)} className={columns === 1 ? PRIMARY_BUTTON : SECONDARY_BUTTON_SM}>1 column</button>
            <button type="button" onClick={() => setColumns(2)} className={columns === 2 ? PRIMARY_BUTTON : SECONDARY_BUTTON_SM}>2 columns</button>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} />
            Show prices
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={showDescriptions} onChange={(e) => setShowDescriptions(e.target.checked)} />
            Show descriptions
          </label>
          <button type="button" onClick={() => window.print()} className={`${PRIMARY_BUTTON} ml-auto`}>
            Save as PDF
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Save as PDF opens your browser&rsquo;s print dialog — choose &ldquo;Save as PDF&rdquo; as the destination.
        </p>
      </div>

      {/* The menu — this is what prints */}
      <article className="font-serif">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-8">{title}</h2>
        {drinks.length === 0 ? (
          <p className="text-slate-500 text-center text-sm no-print">This menu has no drinks yet.</p>
        ) : (
          <div className={columns === 2 ? 'sm:columns-2 sm:gap-12' : ''}>
            {drinks.map((d, i) => (
              <div key={`${d.name}-${i}`} className="mb-5 break-inside-avoid">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
                  {showPrices && d.sale_price_p !== null && (
                    <span className="text-lg text-slate-700 whitespace-nowrap">{formatMoney(d.sale_price_p)}</span>
                  )}
                </div>
                {showDescriptions && d.description && d.description.trim() !== '' && (
                  <p className="text-sm text-slate-600 italic mt-1 leading-relaxed">{d.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  )
}
