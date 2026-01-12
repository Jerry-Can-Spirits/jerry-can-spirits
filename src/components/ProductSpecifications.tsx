import { ShopifyMetafield } from '@/lib/shopify'

interface ProductSpecificationsProps {
  metafields?: ShopifyMetafield[]
}

// Helper function to parse metafields into a structured object
function parseMetafields(metafields: ShopifyMetafield[]) {
  const specs: Record<string, string> = {}

  metafields.forEach((field) => {
    const key = `${field.namespace}.${field.key}`
    specs[key] = field.value
  })

  return specs
}

// Helper function to get a metafield value
function getSpec(specs: Record<string, string>, namespace: string, key: string): string | null {
  return specs[`${namespace}.${key}`] || null
}

export default function ProductSpecifications({
  metafields = [],
}: ProductSpecificationsProps) {
  if (metafields.length === 0) {
    return null
  }

  const specs = parseMetafields(metafields)

  // Get all specifications
  const ageStatement = getSpec(specs, 'specifications', 'age_statement')
  const rumType = getSpec(specs, 'specifications', 'rum_type')
  const distillationMethod = getSpec(specs, 'specifications', 'distillation_method')
  const abv = getSpec(specs, 'specifications', 'abv')
  const origin = getSpec(specs, 'specifications', 'origin')
  const region = getSpec(specs, 'specifications', 'region')
  const colour = getSpec(specs, 'specifications', 'colour')
  const awards = getSpec(specs, 'specifications', 'awards')

  return (
    <section id="details" className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gold-300 mb-6">
        Product Specifications
      </h2>

      {/* Specifications Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
          {ageStatement && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                Age Statement
              </dt>
              <dd className="text-parchment-100 font-medium">{ageStatement}</dd>
            </div>
          )}

          {rumType && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                Rum Type
              </dt>
              <dd className="text-parchment-100 font-medium">{rumType}</dd>
            </div>
          )}

          {distillationMethod && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                Distillation Method
              </dt>
              <dd className="text-parchment-100 font-medium">{distillationMethod}</dd>
            </div>
          )}

          {abv && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                ABV
              </dt>
              <dd className="text-parchment-100 font-medium">{abv}</dd>
            </div>
          )}

          {origin && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                Origin
              </dt>
              <dd className="text-parchment-100 font-medium">{origin}</dd>
            </div>
          )}

          {region && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                Region
              </dt>
              <dd className="text-parchment-100 font-medium">{region}</dd>
            </div>
          )}

          {colour && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-1">
                Colour
              </dt>
              <dd className="text-parchment-100 font-medium">{colour}</dd>
            </div>
          )}

          {awards && (
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-gold-500/10 sm:col-span-2">
              <dt className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-2">
                Awards & Accolades
              </dt>
              <dd className="text-parchment-100 font-medium whitespace-pre-line">{awards}</dd>
            </div>
          )}
      </div>
    </section>
  )
}
