import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { client } from '@/sanity/client'
import {
  cocktailsListQuery,
  ingredientsListQuery,
  equipmentListQuery,
  guidesListQuery,
} from '@/sanity/queries'

export const metadata: Metadata = {
  title: { absolute: 'Site Map | Jerry Can Spirits®' },
  description: 'A complete index of all pages on the Jerry Can Spirits website — cocktail recipes, ingredient guides, bar equipment, and more.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/sitemap/',
  },
}

interface SlugItem {
  _id: string
  name?: string
  title?: string
  slug: { current: string }
  category?: string
  family?: string
}

function groupBy<T extends SlugItem>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const group = (item[key] as string) || 'Other'
    ;(acc[group] ??= []).push(item)
    return acc
  }, {})
}

function SitemapSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-serif font-bold text-gold-300 mb-6 pb-3 border-b border-gold-500/20">
        {title}
      </h2>
      {children}
    </section>
  )
}

function LinkGrid({ items }: { items: { href: string; label: string }[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-parchment-300 hover:text-gold-300 transition-colors text-sm"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

const staticPages = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop/' },
  { label: 'Field Manual', href: '/field-manual/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'Our Story', href: '/about/story/' },
  { label: 'Meet the Team', href: '/about/team/' },
  { label: 'Sustainability', href: '/sustainability/' },
  { label: 'Friends & Partners', href: '/friends/' },
  { label: 'Reviews', href: '/reviews/' },
  { label: 'Stockists', href: '/stockists/' },
  { label: 'FAQ', href: '/faq/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Media & Press', href: '/contact/media/' },
]

const categoryLabels: Record<string, string> = {
  'spirits-education': 'Spirits Education',
  'rum-guides': 'Rum Guides',
  'cocktail-techniques': 'Cocktail Techniques',
  'buying-guides': 'Buying Guides',
  'uk-craft-spirits': 'UK Craft Spirits',
  'industry-insights': 'Industry Insights',
  'seasonal-occasions': 'Seasonal & Occasions',
}

export default async function SitemapPage() {
  const [cocktails, ingredients, equipment, guides] = await Promise.all([
    client.fetch<SlugItem[]>(cocktailsListQuery),
    client.fetch<SlugItem[]>(ingredientsListQuery),
    client.fetch<SlugItem[]>(equipmentListQuery),
    client.fetch<SlugItem[]>(guidesListQuery),
  ])

  const ingredientsByCategory = groupBy(ingredients, 'category')
  const equipmentByCategory = groupBy(equipment, 'category')
  const guidesByCategory = groupBy(guides, 'category')

  const sortedCocktails = [...cocktails].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  )

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs items={[{ label: 'Site Map' }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            Site Map
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
          Every Page. One Place.
        </h1>
        <p className="text-parchment-300 text-lg">
          A complete index of the Jerry Can Spirits website.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Static pages */}
        <SitemapSection title="The Expedition">
          <LinkGrid items={staticPages} />
        </SitemapSection>

        {/* Cocktails */}
        <SitemapSection title={`Field Manual — Cocktails (${cocktails.length})`}>
          <LinkGrid
            items={sortedCocktails.map((c) => ({
              href: `/field-manual/cocktails/${c.slug.current}/`,
              label: c.name ?? c.slug.current,
            }))}
          />
        </SitemapSection>

        {/* Ingredients by category */}
        <SitemapSection title={`Field Manual — Ingredients (${ingredients.length})`}>
          <div className="space-y-8">
            {Object.entries(ingredientsByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
                    {category}
                  </h3>
                  <LinkGrid
                    items={[...items]
                      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                      .map((i) => ({
                        href: `/field-manual/ingredients/${i.slug.current}/`,
                        label: i.name ?? i.slug.current,
                      }))}
                  />
                </div>
              ))}
          </div>
        </SitemapSection>

        {/* Equipment by category */}
        <SitemapSection title={`Field Manual — Equipment (${equipment.length})`}>
          <div className="space-y-8">
            {Object.entries(equipmentByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
                    {category}
                  </h3>
                  <LinkGrid
                    items={[...items]
                      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                      .map((e) => ({
                        href: `/field-manual/equipment/${e.slug.current}/`,
                        label: e.name ?? e.slug.current,
                      }))}
                  />
                </div>
              ))}
          </div>
        </SitemapSection>

        {/* Guides by category */}
        <SitemapSection title={`Guides (${guides.length})`}>
          <div className="space-y-8">
            {Object.entries(guidesByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
                    {categoryLabels[category] ?? category}
                  </h3>
                  <LinkGrid
                    items={items.map((g) => ({
                      href: `/guides/${g.slug.current}/`,
                      label: g.title ?? g.slug.current,
                    }))}
                  />
                </div>
              ))}
          </div>
        </SitemapSection>

      </div>
    </main>
  )
}
