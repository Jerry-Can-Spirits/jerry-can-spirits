// types/cloudflare-env.d.ts
export {}

declare global {
  // KVNamespace type for Cloudflare Workers KV
  interface KVNamespaceGetOptions<Type> {
    type: Type
    cacheTtl?: number
  }

  interface KVNamespacePutOptions {
    expiration?: number
    expirationTtl?: number
    metadata?: unknown
  }

  interface KVNamespace {
    get(key: string, options?: Partial<KVNamespaceGetOptions<undefined>>): Promise<string | null>
    get(key: string, type: 'text'): Promise<string | null>
    get<ExpectedValue = unknown>(key: string, type: 'json'): Promise<ExpectedValue | null>
    get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>
    get(key: string, type: 'stream'): Promise<ReadableStream | null>
    get<ExpectedValue = unknown>(key: string, options: KVNamespaceGetOptions<'json'>): Promise<ExpectedValue | null>
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVNamespacePutOptions): Promise<void>
    delete(key: string): Promise<void>
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>
  }

  interface CloudflareEnv {
    KLAVIYO_PRIVATE_KEY: string
    // Cloudflare KV namespace for cocktail ratings
    COCKTAIL_RATINGS: KVNamespace
  }
}
