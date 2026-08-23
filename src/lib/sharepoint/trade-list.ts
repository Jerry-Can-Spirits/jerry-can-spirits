// Push a trade venue to the SharePoint Trade Accounts list.
//
// WHY SHAREPOINT AT ALL, WHEN D1 HOLDS THIS. Because an audit asks "show me
// your due diligence on this venue" and nobody wants to run SQL in front of an
// inspector. D1 stays the operational store — the portal authenticates against
// it on every login and it has to be authoritative for PINs and active flags.
// SharePoint is the compliance record: the thing you open, filter, and hand
// over. HMRC never needs to see the trade_accounts table.
//
// THE PUSH IS ONE-WAY AND NEVER READ BACK. Two-way sync between a database and
// a list is a reliable source of "which one is right?", and under AWRS that
// question needs an unambiguous answer. D1 wins, always, and SharePoint
// reflects it.
//
// DOCUMENTS STAY IN R2. Director ID is an identity document. Copying it here
// would create a second retention clock and a second place to honour a deletion
// request, for no gain — the row records where the documents live and R2 serves
// them through expiring links. That was a deliberate choice, not an oversight.
//
// FAILURE IS NEVER FATAL. Everything here is called from waitUntil after the
// response has gone. A venue's application must not fail because Microsoft is
// having an afternoon, and the row can be reconciled on the next status change.

import { GRAPH, getGraphToken, graphConfigured, graphFetch, type GraphEnv } from './graph'

const LIST_NAME = 'Trade Accounts'
const LIST_KV_KEY = 'sharepoint:trade-list-id'

/**
 * Columns, created once if the list does not exist.
 *
 * Text throughout rather than choice or lookup columns. A choice column that
 * disagrees with the application's actual value rejects the write, and the
 * values here come from a form that changes — business types and volume bands
 * have both been rewritten already. A rejected push that loses an audit record
 * is a worse outcome than a column that permits an unexpected string.
 */
const COLUMNS: Array<{ name: string; text: Record<string, unknown> }> = [
  { name: 'ApplicationId', text: {} },
  { name: 'AccountId', text: {} },
  { name: 'Status', text: {} },
  { name: 'LegalEntity', text: {} },
  { name: 'CompanyNumber', text: {} },
  { name: 'LegalStructure', text: {} },
  { name: 'BusinessType', text: {} },
  { name: 'ContactName', text: {} },
  { name: 'ContactEmail', text: {} },
  { name: 'ContactPhone', text: {} },
  { name: 'TradingAddress', text: {} },
  { name: 'LicensingAuthority', text: {} },
  { name: 'Tier', text: {} },
  { name: 'DiscountCode', text: {} },
  { name: 'Verification', text: { allowMultipleLines: true } },
  { name: 'Documents', text: {} },
  { name: 'SubmittedAt', text: {} },
  { name: 'LastPushed', text: {} },
]

export interface TradeVenueRecord {
  applicationId: string
  tradingName: string
  status: string
  legalEntity?: string | null
  companyNumber?: string | null
  legalStructure?: string | null
  businessType?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  tradingAddress?: string | null
  licensingAuthority?: string | null
  accountId?: string | null
  tier?: string | null
  discountCode?: string | null
  /** Joined verification summaries, newest first. */
  verification?: string | null
  submittedAt?: string | null
}

async function findOrCreateList(token: string, siteId: string, kv: KVNamespace): Promise<string> {
  const cached = await kv.get(LIST_KV_KEY)
  if (cached) return cached

  const existing = await graphFetch(
    token,
    `${GRAPH}/sites/${siteId}/lists?$filter=displayName eq '${LIST_NAME}'`,
  )
  if (existing.ok) {
    const json = (await existing.json()) as { value?: Array<{ id: string }> }
    const hit = json.value?.[0]
    if (hit) {
      await kv.put(LIST_KV_KEY, hit.id)
      return hit.id
    }
  }

  const created = await graphFetch(token, `${GRAPH}/sites/${siteId}/lists`, {
    method: 'POST',
    body: JSON.stringify({
      displayName: LIST_NAME,
      list: { template: 'genericList' },
      columns: COLUMNS.map((c) => ({ name: c.name, text: c.text })),
    }),
  })
  if (!created.ok) {
    const detail = await created.text().catch(() => '')
    throw new Error(`Could not create the ${LIST_NAME} list (${created.status}). ${detail.slice(0, 300)}`)
  }

  const json = (await created.json()) as { id: string }
  await kv.put(LIST_KV_KEY, json.id)
  return json.id
}

function fields(record: TradeVenueRecord): Record<string, string> {
  const out: Record<string, string> = {
    Title: record.tradingName,
    ApplicationId: record.applicationId,
    Status: record.status,
    LastPushed: new Date().toISOString(),
    // Where the documents actually are. Not a link, because R2 serves them
    // through URLs that expire after a week by design.
    Documents: `R2 jerry-can-spirits-trade-docs, applications/${record.applicationId}/`,
  }
  const optional: Array<[string, string | null | undefined]> = [
    ['AccountId', record.accountId],
    ['LegalEntity', record.legalEntity],
    ['CompanyNumber', record.companyNumber],
    ['LegalStructure', record.legalStructure],
    ['BusinessType', record.businessType],
    ['ContactName', record.contactName],
    ['ContactEmail', record.contactEmail],
    ['ContactPhone', record.contactPhone],
    ['TradingAddress', record.tradingAddress],
    ['LicensingAuthority', record.licensingAuthority],
    ['Tier', record.tier],
    ['DiscountCode', record.discountCode],
    ['Verification', record.verification],
    ['SubmittedAt', record.submittedAt],
  ]
  for (const [key, value] of optional) {
    if (value !== null && value !== undefined && value !== '') out[key] = value
  }
  return out
}

/**
 * Create or update the row for a venue, keyed on the application id.
 *
 * Keyed on the application rather than the account because a venue exists in
 * the register from the moment it applies, and an application that never
 * becomes an account is exactly the case an auditor might ask about.
 */
export async function pushTradeVenue(
  env: GraphEnv,
  kv: KVNamespace,
  record: TradeVenueRecord,
): Promise<void> {
  if (!graphConfigured(env)) return

  const token = await getGraphToken(env, kv)
  const siteId = env.SHAREPOINT_SITE_ID!
  const listId = await findOrCreateList(token, siteId, kv)

  const search = await graphFetch(
    token,
    `${GRAPH}/sites/${siteId}/lists/${listId}/items?$expand=fields&$filter=fields/ApplicationId eq '${record.applicationId}'`,
    { headers: { Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' } },
  )

  let itemId: string | null = null
  if (search.ok) {
    const json = (await search.json()) as { value?: Array<{ id: string }> }
    itemId = json.value?.[0]?.id ?? null
  }

  const body = JSON.stringify(itemId ? fields(record) : { fields: fields(record) })
  const res = itemId
    ? await graphFetch(token, `${GRAPH}/sites/${siteId}/lists/${listId}/items/${itemId}/fields`, {
        method: 'PATCH',
        body,
      })
    : await graphFetch(token, `${GRAPH}/sites/${siteId}/lists/${listId}/items`, {
        method: 'POST',
        body,
      })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`SharePoint push failed (${res.status}). ${detail.slice(0, 300)}`)
  }
}
