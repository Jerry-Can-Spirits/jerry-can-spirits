import { createXeroAdapter, XERO_AUTHORIZE_URL, XERO_SCOPES } from './xero'
import type { AccountingAdapter, AccountingProvider } from '../types'

/** Env slice the registry needs. All optional: adapters are unavailable
 *  (null) when their vars are missing, and the UI card renders disabled. */
export interface AccountingProvidersEnv {
  XERO_CLIENT_ID?: string
  XERO_CLIENT_SECRET?: string
  QUICKBOOKS_CLIENT_ID?: string
  QUICKBOOKS_CLIENT_SECRET?: string
  QUICKBOOKS_ENV?: string
}

export function getAccountingAdapter(provider: AccountingProvider, env: AccountingProvidersEnv): AccountingAdapter | null {
  switch (provider) {
    case 'xero':
      if (!env.XERO_CLIENT_ID || !env.XERO_CLIENT_SECRET) return null
      return createXeroAdapter({ XERO_CLIENT_ID: env.XERO_CLIENT_ID, XERO_CLIENT_SECRET: env.XERO_CLIENT_SECRET })
    case 'quickbooks':
      return null
    default:
      return null
  }
}

/** Async because QuickBooks resolves its authorize endpoint from Intuit's
 *  discovery document (a written Intuit questionnaire commitment). */
export async function getAccountingAuthorizeUrl(
  provider: AccountingProvider,
  env: AccountingProvidersEnv,
  state: string,
  redirectUri: string,
): Promise<string | null> {
  switch (provider) {
    case 'xero': {
      if (!env.XERO_CLIENT_ID) return null
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.XERO_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: XERO_SCOPES,
        state,
      })
      return `${XERO_AUTHORIZE_URL}?${params.toString()}`
    }
    case 'quickbooks':
      return null
    default:
      return null
  }
}
