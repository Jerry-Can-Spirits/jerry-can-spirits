interface CloudflareEnv {
  // KV Namespaces
  COCKTAIL_RATINGS: KVNamespace;
  SITE_OPS: KVNamespace;

  // D1 Database
  DB: D1Database;

  // Secrets — Klaviyo
  KLAVIYO_PRIVATE_KEY: string;

  // Secrets — Meta / Social
  META_ACCESS_TOKEN: string;
  META_FB_PAGE_ID: string;
  META_IG_ACCOUNT_ID: string;

  // Secrets — Shopify Admin API (for webhooks, stock sync)
  SHOPIFY_ADMIN_API_TOKEN: string;
  SHOPIFY_WEBHOOK_SECRET: string;

  // Worker bindings
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
}
