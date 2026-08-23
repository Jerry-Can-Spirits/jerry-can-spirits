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
): Promise<void> {
  if (!graphConfigured(env)) return

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
    if (!app) return

    const account = await db
      .prepare(`SELECT id, tier, discount_code FROM trade_accounts WHERE application_id = ?1`)
      .bind(applicationId)
      .first<AccountRow>()

    const checks = await db
      .prepare(
        `SELECT source, outcome, summary, checked_at
         FROM trade_application_verifications
         WHERE trade_application_id = ?1
         ORDER BY checked_at DESC`,
      )
      .bind(applicationId)
      .all<VerificationRow>()

    // Newest first, one line each. This is the column an auditor reads, so it
    // carries the date and the verdict before the detail.
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
      accountId: account?.id ?? null,
      tier: account?.tier ?? null,
      discountCode: account?.discount_code ?? null,
      verification,
      submittedAt: app.submitted_at,
    }

    await pushTradeVenue(env, kv, record)
  } catch (err) {
    Sentry.captureException(err, { tags: { integration: 'sharepoint', applicationId } })
  }
}
