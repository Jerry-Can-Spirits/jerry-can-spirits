import { createSquareAdapter, getSquareBaseUrl } from './square'
import type { PosAdapter, PosProvider } from '../types'

/** Env slice the registry needs. All optional — adapters are unavailable (null) when their vars are missing. */
export interface ProvidersEnv {
  SQUARE_APP_ID?: string
  SQUARE_APP_SECRET?: string
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string
  SQUARE_ENV?: string
  ZETTLE_CLIENT_ID?: string
  ZETTLE_CLIENT_SECRET?: string
}

export function getAdapterForProvider(provider: PosProvider, env: ProvidersEnv): PosAdapter | null {
  switch (provider) {
    case 'square':
      if (!env.SQUARE_APP_ID || !env.SQUARE_APP_SECRET || !env.SQUARE_WEBHOOK_SIGNATURE_KEY) return null
      return createSquareAdapter({
        SQUARE_APP_ID: env.SQUARE_APP_ID,
        SQUARE_APP_SECRET: env.SQUARE_APP_SECRET,
        SQUARE_WEBHOOK_SIGNATURE_KEY: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
        SQUARE_ENV: env.SQUARE_ENV,
      })
    default:
      return null
  }
}

/** Authorize URL for OAuth providers; null for api-key providers / unknown. */
export function getOAuthAuthorizeUrl(
  provider: PosProvider,
  env: ProvidersEnv,
  state: string,
  redirectUri: string,
): string | null {
  switch (provider) {
    case 'square': {
      if (!env.SQUARE_APP_ID) return null
      const params = new URLSearchParams({
        client_id: env.SQUARE_APP_ID,
        scope: 'ORDERS_READ ITEMS_READ MERCHANT_PROFILE_READ',
        session: 'false',
        state,
        redirect_uri: redirectUri,
      })
      return `${getSquareBaseUrl({ SQUARE_ENV: env.SQUARE_ENV })}/oauth2/authorize?${params.toString()}`
    }
    default:
      return null
  }
}
