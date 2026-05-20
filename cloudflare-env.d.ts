interface CloudflareEnv {
  // KV Namespaces
  COCKTAIL_RATINGS: KVNamespace;
  SITE_OPS: KVNamespace;

  // D1 Database
  DB: D1Database;

  // Secrets — Klaviyo
  KLAVIYO_PRIVATE_KEY: string;
  KLAVIYO_TRADE_LIST_ID: string;

  // Secrets — Anthropic (Pour IQ AI recommendations)
  ANTHROPIC_API_KEY: string;

  // Secrets — Meta / Social
  META_ACCESS_TOKEN: string;
  META_FB_PAGE_ID: string;
  META_IG_ACCOUNT_ID: string;

  // Secrets — Shopify Admin API (for webhooks, stock sync)
  SHOPIFY_ADMIN_API_TOKEN: string;
  SHOPIFY_WEBHOOK_SECRET: string;

  // Secrets — Turnstile (bot protection)
  TURNSTILE_SECRET_KEY: string;

  // Secrets — Mapbox (geocoding)
  MAPBOX_SECRET_TOKEN: string;

  // Secrets — Google Maps (Places API for live ratings)
  GOOGLE_MAPS_API_KEY: string;

  // Secrets — Sentry (source map uploads)
  SENTRY_AUTH_TOKEN: string;

  // Secrets — Trade portal
  TRADE_SESSION_SECRET: string;
  TRADE_CASE_VARIANT_ID: string;

  // Secrets — Resend (trade application admin emails)
  RESEND_API_KEY: string;
  TRADE_APPLICATIONS_EMAIL: string;

  // Secrets — Square (POS integration)
  SQUARE_APP_ID: string;
  SQUARE_APP_SECRET: string;
  SQUARE_WEBHOOK_SIGNATURE_KEY: string;
  SQUARE_ENV?: string;  // 'sandbox' to target sandbox hosts; anything else = production

  // Secrets — R2 presigning (S3-compatible API for presigning download URLs)
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;

  // R2 Buckets
  TRADE_DOCS: R2Bucket;

  // Worker bindings
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
}
