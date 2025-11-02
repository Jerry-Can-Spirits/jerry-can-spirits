// types/cloudflare-env.d.ts
export {}

declare global {
  interface CloudflareEnv {
    KLAVIYO_PRIVATE_KEY: string
    // add any others here, e.g.
    // SENTRY_DSN?: string
  }
}
