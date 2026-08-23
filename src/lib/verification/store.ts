// Run the due diligence checks for an application and record what came back.
//
// This is the half the register was missing. It recorded what a venue told us
// and nothing about what we checked, which is what an audit asks for. Every run
// writes a row whether it succeeded, found nothing, or errored — a check that
// failed is itself evidence, and silently dropping it would leave a gap that
// looks identical to never having looked.
//
// Nothing here blocks or fails an application. A venue submitting a form at
// nine on a Friday should not be turned away because Companies House is having
// an evening, and refusing an application on an automated signal is not what
// AWRS asks for anyway: the obligation is to assess risk and act on it, with a
// human deciding. These checks produce the evidence that decision is made from.

import { lookupCompany, assessCompany } from './companies-house'
import { lookupPostcode, administrativeArea } from './postcode'

export interface VerificationRow {
  trade_application_id: string
  source: 'companies_house' | 'postcode' | 'vat' | 'manual'
  query: string
  outcome: 'match' | 'mismatch' | 'not_found' | 'error'
  summary: string | null
  response_json: string | null
}

export async function recordVerification(db: D1Database, row: VerificationRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO trade_application_verifications
         (trade_application_id, source, query, outcome, summary, response_json, checked_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(
      row.trade_application_id,
      row.source,
      row.query,
      row.outcome,
      row.summary,
      row.response_json,
      new Date().toISOString(),
    )
    .run()
}

export interface ApplicationFacts {
  companies_house_number?: string | null
  legal_structure?: string | null
  legal_entity_name?: string | null
  years_trading?: number | null
  trading_postcode?: string | null
}

/**
 * Everything that can be checked automatically, recorded as it goes.
 *
 * Each check is wrapped so one failing source cannot prevent another from
 * running or from being written down. The first version let a Companies House
 * timeout take the postcode check with it, which is precisely the shape of bug
 * that leaves an audit trail with holes in it and no explanation for them.
 */
export async function runApplicationChecks(
  db: D1Database,
  applicationId: string,
  facts: ApplicationFacts,
  env: { COMPANIES_HOUSE_API_KEY?: string },
): Promise<void> {
  const number = facts.companies_house_number?.trim()
  if (number) {
    try {
      if (!env.COMPANIES_HOUSE_API_KEY) {
        await recordVerification(db, {
          trade_application_id: applicationId,
          source: 'companies_house',
          query: number,
          outcome: 'error',
          summary: 'COMPANIES_HOUSE_API_KEY is not set, so no lookup was attempted.',
          response_json: null,
        })
      } else {
        const result = await lookupCompany(env.COMPANIES_HOUSE_API_KEY, number)
        if (result.outcome === 'match') {
          const { flags, confirmations } = assessCompany(result.company, {
            legal_structure: facts.legal_structure ?? undefined,
            legal_entity_name: facts.legal_entity_name ?? undefined,
            years_trading: facts.years_trading ?? undefined,
          })
          await recordVerification(db, {
            trade_application_id: applicationId,
            source: 'companies_house',
            query: number,
            // A mismatch is still a successful lookup. The distinction matters:
            // "we checked and it disagreed" is a much stronger position than
            // "we checked and something went wrong".
            outcome: flags.length ? 'mismatch' : 'match',
            summary: [
              `${result.company.company_name} (${result.company.company_status})`,
              ...confirmations.map((c) => `OK: ${c}`),
              ...flags.map((f) => `CHECK: ${f}`),
            ].join(' | '),
            response_json: JSON.stringify(result.raw),
          })
        } else {
          await recordVerification(db, {
            trade_application_id: applicationId,
            source: 'companies_house',
            query: number,
            outcome: result.outcome === 'not_found' ? 'not_found' : 'error',
            summary: result.outcome === 'error' ? result.message : 'No company with that number',
            response_json: null,
          })
        }
      }
    } catch (e) {
      await recordVerification(db, {
        trade_application_id: applicationId,
        source: 'companies_house',
        query: number,
        outcome: 'error',
        summary: e instanceof Error ? e.message : 'Lookup threw',
        response_json: null,
      }).catch(() => {})
    }
  }

  const postcode = facts.trading_postcode?.trim()
  if (postcode) {
    try {
      const result = await lookupPostcode(postcode)
      if (result.outcome === 'match') {
        await recordVerification(db, {
          trade_application_id: applicationId,
          source: 'postcode',
          query: postcode,
          outcome: 'match',
          summary: `Trading address is in ${administrativeArea(result.record.admin_district)} (${result.record.admin_district})`,
          response_json: JSON.stringify(result.raw),
        })
      } else {
        await recordVerification(db, {
          trade_application_id: applicationId,
          source: 'postcode',
          query: postcode,
          outcome: result.outcome === 'not_found' ? 'not_found' : 'error',
          summary: result.outcome === 'error' ? result.message : 'Postcode not recognised',
          response_json: null,
        })
      }
    } catch (e) {
      await recordVerification(db, {
        trade_application_id: applicationId,
        source: 'postcode',
        query: postcode,
        outcome: 'error',
        summary: e instanceof Error ? e.message : 'Lookup threw',
        response_json: null,
      }).catch(() => {})
    }
  }
}
