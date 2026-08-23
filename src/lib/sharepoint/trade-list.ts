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

/**
 * The list to write into, by its URL name or display name.
 *
 * It writes to a list that already exists and never creates one. The first
 * version created "Trade Accounts" if it was absent, which was wrong twice
 * over: a customer register already existed and was the natural home, and a
 * silent create means a failure and a success both end with "there is a list
 * somewhere" and no way to tell which happened.
 *
 * Override with SHAREPOINT_LIST if the list is ever renamed.
 */
const DEFAULT_LIST = 'CustomerRegister'
const LIST_KV_PREFIX = 'sharepoint:list-id:'
const KEY_COLUMN = 'ApplicationId'

/**
 * Create the ApplicationId column if the register has no key.
 *
 * Without a stable key there is no way to tell one venue's row from another,
 * and every status change would append a duplicate rather than update. Trading
 * name and email both looked like candidates and both are wrong: a name gets
 * corrected (this happened on the first venue, within hours) and an email
 * changes when staff do.
 *
 * Indexed, because the push filters on it on every write.
 */
export async function ensureKeyColumn(
  env: GraphEnv,
  kv: KVNamespace,
): Promise<{ created: boolean; message: string }> {
  const token = await getGraphToken(env, kv)
  const siteId = env.SHAREPOINT_SITE_ID!
  const listName = env.SHAREPOINT_LIST || DEFAULT_LIST
  const { id: listId, columns } = await resolveList(token, siteId, listName, kv)

  if (columns.has(KEY_COLUMN)) {
    return { created: false, message: `${KEY_COLUMN} already exists on "${listName}".` }
  }

  const res = await graphFetch(token, `${GRAPH}/sites/${siteId}/lists/${listId}/columns`, {
    method: 'POST',
    body: JSON.stringify({
      name: KEY_COLUMN,
      displayName: 'Application ID',
      description: 'Links this row to the trade application. Set automatically — do not edit by hand.',
      text: { allowMultipleLines: false, maxLength: 64 },
      indexed: true,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Could not add ${KEY_COLUMN} to "${listName}" (${res.status}). ${detail.slice(0, 400)}`)
  }
  return { created: true, message: `Added ${KEY_COLUMN} to "${listName}".` }
}

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
  /** ONS region from the trading postcode, for CustomerRegion. */
  region?: string | null
  accountId?: string | null
  tier?: string | null
  discountCode?: string | null
  /** Joined verification summaries, newest first. */
  verification?: string | null
  submittedAt?: string | null
}

/**
 * Resolve the list by name, and its column names alongside it.
 *
 * The columns matter because this writes into a list somebody else built. A
 * PATCH naming a field the list does not have is rejected outright, taking the
 * whole row with it — so the push only ever sends fields that exist, and says
 * in the error which ones it had to drop.
 */
async function resolveList(
  token: string,
  siteId: string,
  listName: string,
  kv: KVNamespace,
): Promise<{ id: string; columns: Set<string> }> {
  const cacheKey = `${LIST_KV_PREFIX}${listName}`
  let listId = await kv.get(cacheKey)

  if (!listId) {
    // `name` is the URL segment (CustomerRegister); `displayName` is what shows
    // in the UI (Customer Register). People give whichever they are looking at.
    const res = await graphFetch(token, `${GRAPH}/sites/${siteId}/lists?$select=id,name,displayName`)
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Could not list SharePoint lists (${res.status}). ${detail.slice(0, 300)}`)
    }
    const json = (await res.json()) as { value?: Array<{ id: string; name: string; displayName: string }> }
    const wanted = listName.toLowerCase().replace(/\s+/g, '')
    const hit = json.value?.find(
      (l) =>
        l.name?.toLowerCase().replace(/\s+/g, '') === wanted ||
        l.displayName?.toLowerCase().replace(/\s+/g, '') === wanted,
    )
    if (!hit) {
      const available = (json.value ?? []).map((l) => l.displayName).join(', ')
      throw new Error(`No SharePoint list called "${listName}". Available: ${available}`)
    }
    listId = hit.id
    await kv.put(cacheKey, listId)
  }

  const colRes = await graphFetch(token, `${GRAPH}/sites/${siteId}/lists/${listId}/columns?$select=name`)
  const columns = new Set<string>()
  if (colRes.ok) {
    const json = (await colRes.json()) as { value?: Array<{ name: string }> }
    for (const c of json.value ?? []) columns.add(c.name)
  }

  return { id: listId, columns }
}

/**
 * Map a venue onto the Customer Register's existing columns.
 *
 * The register was built by hand before any of this and its schema is better
 * than the one this code was going to create — it already had an
 * AWRSDueDiligence column, which is exactly where the verification evidence
 * belongs and a better name than anything invented here. So the code adapts to
 * the register rather than the register to the code.
 *
 * Fields with no column of their own are gathered into CustomerNotes rather
 * than dropped. Company number and legal structure are the sort of thing an
 * auditor asks for, and losing them because the list predates the integration
 * would defeat the point of having it.
 *
 * FirstOrderDate and LastOrderDate are deliberately never written. They are
 * order data, this system holds none, and writing a blank over something
 * somebody filled in by hand is how an automated sync earns its reputation.
 */
function fields(record: TradeVenueRecord): Record<string, string> {
  const notes = [
    record.legalEntity ? `Legal entity: ${record.legalEntity}` : null,
    record.companyNumber ? `Companies House: ${record.companyNumber}` : null,
    record.legalStructure ? `Structure: ${record.legalStructure}` : null,
    record.licensingAuthority ? `Licensing authority: ${record.licensingAuthority}` : null,
    record.tier ? `Tier: ${record.tier}` : null,
    record.discountCode ? `Discount code: ${record.discountCode}` : null,
    record.accountId ? `Trade account: ${record.accountId}` : null,
    record.submittedAt ? `Applied: ${record.submittedAt.slice(0, 10)}` : null,
    // Where the documents are. Not a link: R2 serves them through URLs that
    // expire after a week by design, so a stored link would rot.
    `Documents: R2 jerry-can-spirits-trade-docs, applications/${record.applicationId}/`,
  ]
    .filter(Boolean)
    .join('\n')

  const out: Record<string, string> = {
    Title: record.tradingName,
    ApplicationId: record.applicationId,
    CustomerStatus: record.status,
    CustomerNotes: notes,
    // Every account is pro-forma; the question was removed from the form
    // because the portal is pay-before-delivery.
    CustPaymentTerms: 'Pro-forma',
  }

  const optional: Array<[string, string | null | undefined]> = [
    ['CustomerType', record.businessType],
    ['ContactName', record.contactName],
    ['CustomerEmail', record.contactEmail],
    ['CustomerPhone', record.contactPhone],
    ['CustomerAddress', record.tradingAddress],
    ['CustomerRegion', record.region],
    ['AWRSDueDiligence', record.verification],
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
): Promise<{ action: 'created' | 'updated'; skipped: string[] }> {
  if (!graphConfigured(env)) throw new Error('Graph is not configured; check the four MS_* secrets.')

  const token = await getGraphToken(env, kv)
  const siteId = env.SHAREPOINT_SITE_ID!
  const listName = env.SHAREPOINT_LIST || DEFAULT_LIST
  const { id: listId, columns } = await resolveList(token, siteId, listName, kv)

  const all = fields(record)
  // Title always exists on a SharePoint list. Everything else has to be there.
  const send: Record<string, string> = {}
  const skipped: string[] = []
  for (const [key, value] of Object.entries(all)) {
    if (key === 'Title' || columns.size === 0 || columns.has(key)) send[key] = value
    else skipped.push(key)
  }

  // Matching on our own key column only works if the list has one. Without it
  // there is no way to tell one venue's row from another's, so the push refuses
  // rather than appending a duplicate on every status change.
  if (columns.size > 0 && !columns.has(KEY_COLUMN)) {
    throw new Error(
      `The "${listName}" list has no ${KEY_COLUMN} column, so rows cannot be matched and every update ` +
        `would append a duplicate. Add a single line of text column named ${KEY_COLUMN}, or POST {"action":"add-key-column"} to /api/trade/sharepoint-check. ` +
        `Columns found: ${[...columns].join(', ')}`,
    )
  }

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

  const res = itemId
    ? await graphFetch(token, `${GRAPH}/sites/${siteId}/lists/${listId}/items/${itemId}/fields`, {
        method: 'PATCH',
        body: JSON.stringify(send),
      })
    : await graphFetch(token, `${GRAPH}/sites/${siteId}/lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify({ fields: send }),
      })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`SharePoint push failed (${res.status}). ${detail.slice(0, 400)}`)
  }

  return { action: itemId ? 'updated' : 'created', skipped }
}
