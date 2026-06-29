'use client'

import { useMemo, useState } from 'react'
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

interface SectionView {
  section: MenuSectionRow
  drinks: Drink[]
  subSections: { section: MenuSectionRow; drinks: Drink[] }[]
}

function formatMoney(p: number) { return `£${(p / 100).toFixed(2)}` }

function buildViewModel(sections: MenuSectionRow[], drinks: Drink[]) {
  const top = sections
    .filter((s) => s.parent_section_id === null)
    .sort((a, b) => a.position - b.position)
  const drinksFor = (sectionId: string) => drinks.filter((d) => d.section_id === sectionId)
  const topSections: SectionView[] = top.map((section) => ({
    section,
    drinks: drinksFor(section.id),
    subSections: sections
      .filter((s) => s.parent_section_id === section.id)
      .sort((a, b) => a.position - b.position)
      .map((sub) => ({ section: sub, drinks: drinksFor(sub.id) })),
  }))
  const unplaced = drinks.filter((d) => d.section_id === null)
  return { topSections, unplaced }
}

function DrinkPreview({ drink, showPrices, showDescriptions }: { drink: Drink; showPrices: boolean; showDescriptions: boolean }) {
  return (
    <div className="mb-4 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-lg font-bold text-slate-900">{drink.name}</h4>
        {showPrices && drink.sale_price_p !== null && (
          <span className="text-lg text-slate-700 whitespace-nowrap">{formatMoney(drink.sale_price_p)}</span>
        )}
      </div>
      {showDescriptions && drink.description && drink.description.trim() !== '' && (
        <p className="text-sm text-slate-600 italic mt-1 leading-relaxed">{drink.description}</p>
      )}
    </div>
  )
}

function ArrangeDrink({ drink }: { drink: Drink }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-800">{drink.name}</span>
      {drink.sale_price_p !== null && (
        <span className="text-xs text-slate-500 whitespace-nowrap">{formatMoney(drink.sale_price_p)}</span>
      )}
    </div>
  )
}

export function MenuBuilder({ menuName, sections, drinks }: Props) {
  const [title, setTitle] = useState(menuName)
  const [columns, setColumns] = useState<1 | 2>(1)
  const [showPrices, setShowPrices] = useState(true)
  const [showDescriptions, setShowDescriptions] = useState(true)

  const { topSections, unplaced } = useMemo(() => buildViewModel(sections, drinks), [sections, drinks])
  const hasPreview = topSections.some((t) => t.drinks.length > 0 || t.subSections.some((s) => s.drinks.length > 0))

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
          Save as PDF opens your browser&rsquo;s print dialog. Choose &ldquo;Save as PDF&rdquo; as the destination.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Arrange pane — never printed */}
        <div className="no-print space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Arrange</h2>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Unplaced</h3>
            {unplaced.length === 0 ? (
              <p className="text-xs text-slate-400">Every drink is in a section.</p>
            ) : (
              <div className="space-y-2">
                {unplaced.map((d) => <ArrangeDrink key={d.id} drink={d} />)}
              </div>
            )}
          </div>

          {topSections.map(({ section, drinks: direct, subSections }) => (
            <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">{section.name}</h3>
              {direct.length > 0 && (
                <div className="space-y-2 mb-3">
                  {direct.map((d) => <ArrangeDrink key={d.id} drink={d} />)}
                </div>
              )}
              {subSections.map(({ section: sub, drinks: subDrinks }) => (
                <div key={sub.id} className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{sub.name}</h4>
                  {subDrinks.length === 0 ? (
                    <p className="text-xs text-slate-400">No drinks yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {subDrinks.map((d) => <ArrangeDrink key={d.id} drink={d} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Preview pane — this is what prints */}
        <article className="font-serif">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-8">{title}</h2>
          {!hasPreview ? (
            <p className="text-slate-500 text-center text-sm no-print">This menu has no placed drinks yet.</p>
          ) : (
            <div className={columns === 2 ? 'sm:columns-2 sm:gap-12' : ''}>
              {topSections.map(({ section, drinks: direct, subSections }) => {
                if (direct.length === 0 && subSections.every((s) => s.drinks.length === 0)) return null
                return (
                  <section key={section.id} className="mb-8 break-inside-avoid">
                    <h3 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">{section.name}</h3>
                    {direct.map((d) => (
                      <DrinkPreview key={d.id} drink={d} showPrices={showPrices} showDescriptions={showDescriptions} />
                    ))}
                    {subSections.map(({ section: sub, drinks: subDrinks }) => (
                      subDrinks.length === 0 ? null : (
                        <div key={sub.id} className="mt-4">
                          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">{sub.name}</h4>
                          {subDrinks.map((d) => (
                            <DrinkPreview key={d.id} drink={d} showPrices={showPrices} showDescriptions={showDescriptions} />
                          ))}
                        </div>
                      )
                    ))}
                  </section>
                )
              })}
            </div>
          )}
        </article>
      </div>
    </>
  )
}
