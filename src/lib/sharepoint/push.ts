// Build a venue's SharePoint row from D1 and push it.
//
// Every trigger — submission, correction, approval, PIN reissue — calls this
// same function, which re-reads the current state rather than being handed a
// partial update. That is deliberate: a push that only knew about the change it
// was reacting to would drift from D1 one field at a time, and the point of the
// SharePoint copy is that it can be trusted without cross-checking.
//
// Nothing here throws into a caller. Failures are logged to Sentry and the row
// reconciles on the next status change, because a venue's application must not
// fail because Microsoft is having an afternoon.

import * as Sentry from '@sentry/nextjs'
import { pushTradeVenue, type TradeVenueRecord } from './trade-list'
import { graphConfigured, type GraphEnv } from './graph'

interface ApplicationRow {
  id: string
  trading_name: string
  legal_entity_name: string | null
  legal_structure: string | null
  business_type: string | null
  companies_house_number: string | null
  licensing_authority: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  trading_address_json: string | null
  status: string | null
  submitted_at: string | null
}

interface AccountRow {
  id: string
  tier: string | null
  discount_code: string | null
}

interface VerificationRow {
  source: string
  outcome: string
  summary: string | null
  checked_at: string
  response_json: string | null
}

function formatAddress(json: string | null): string | null {
  if (!json) return null
  try {
    const a = JSON.parse(json) as Record<string, string>
    return [a.line1, a.line2, a.town, a.county, a.postcode].filter(Boolean).join(', ') || null
  } catch {
    return null
  }
}

export async function pushApplicationToSharePoint(
  db: D1Database,
  env: GraphEnv,
  kv: KVNamespace,
  applicationId: string,
  // The diagnostic route passes throwOnError so it can report the actual Graph
  // message. Production callers keep the swallow: a venue's application must not
  // fail because Microsoft is having an afternoon.
  opts: { throwOnError?: boolean } = {},
): Promise<{ action: string; skipped: string[] } | void> {
  if (!graphConfigured(env)) {
    if (opts.throwOnError) throw new Error('Graph is not configured; check the four MS_* secrets.')
    return
  }

  try {
    const app = await db
      .prepare(
        `SELECT id, trading_name, legal_entity_name, legal_structure, business_type,
                companies_house_number, licensing_authority, contact_name, contact_email,
                contact_phone, trading_address_json, status, submitted_at
         FROM trade_applications WHERE id = ?1`,
      )
      .bind(applicationId)
      .first<ApplicationRow>()
    if (!app) {
      if (opts.throwOnError) throw new Error(`No application ${applicationId}`)
      return
    }

    const account = await db
      .prepare(`SELECT id, tier, discount_code FROM trade_accounts WHERE application_id = ?1`)
      .bind(applicationId)
      .first<AccountRow>()

    const checks = await db
      .prepare(
        `SELECT source, outcome, summary, checked_at, response_json
         FROM trade_application_verifications
         WHERE trade_application_id = ?1
         ORDER BY checked_at DESC`,
      )
      .bind(applicationId)
      .all<VerificationRow>()

    // Newest first, one line each. This is the column an auditor reads, so it
    // carries the date and the verdict before the detail.
    // The ONS region, lifted from the stored postcode check rather than looked
    // up again. It is already in the evidence; re-fetching it would be a second
    // call for a fact we wrote down.
    let region: string | null = null
    for (const c of checks.results ?? []) {
      if (c.source === 'postcode' && c.outcome === 'match' && c.response_json) {
        try {
          const raw = JSON.parse(c.response_json) as { result?: { region?: string } }
          region = raw.result?.region ?? null
        } catch { /* leave null */ }
        break
      }
    }

    const verification =
      (checks.results ?? [])
        .map((c) => `${c.checked_at.slice(0, 10)} — ${c.source} — ${c.outcome}${c.summary ? `: ${c.summary}` : ''}`)
        .join('\n') || null

    const record: TradeVenueRecord = {
      applicationId: app.id,
      tradingName: app.trading_name,
      status: app.status ?? 'pending',
      legalEntity: app.legal_entity_name,
      companyNumber: app.companies_house_number,
      legalStructure: app.legal_structure,
      businessType: app.business_type,
      contactName: app.contact_name,
      contactEmail: app.contact_email,
      contactPhone: app.contact_phone,
      tradingAddress: formatAddress(app.trading_address_json),
      licensingAuthority: app.licensing_authority,
      region,
      onsRegion: region,
      // Complete only when a check actually ran and nothing was left to chase.
      // A mismatch means Companies House disagreed with something declared, and
      // that is precisely when due diligence is not finished.
      dueDiligenceComplete:
        (checks.results ?? []).some((c) => c.source === 'companies_house' && c.outcome === 'match') &&
        !(checks.results ?? []).some((c) => c.outcome === 'mismatch' || c.outcome === 'error'),
      accountId: account?.id ?? null,
      tier: account?.tier ?? null,
      discountCode: account?.discount_code ?? null,
      verification,
      submittedAt: app.submitted_at,
    }

    return await pushTradeVenue(env, kv, record)
  } catch (err) {
    Sentry.captureException(err, { tags: { integration: 'sharepoint', applicationId } })
    if (opts.throwOnError) throw err
  }
}
