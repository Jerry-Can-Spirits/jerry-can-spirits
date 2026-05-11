import { AwsClient } from 'aws4fetch'

interface PresignOptions {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  key: string
  /** Seconds until the URL expires. R2 caps at 7 days (604800). */
  expiresInSeconds: number
}

export async function presignR2GetUrl(opts: PresignOptions): Promise<string> {
  const client = new AwsClient({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    service: 's3',
    region: 'auto',
  })

  const url = new URL(
    `https://${opts.accountId}.r2.cloudflarestorage.com/${opts.bucket}/${encodeURIComponent(opts.key).replace(/%2F/g, '/')}`
  )
  url.searchParams.set('X-Amz-Expires', String(Math.min(opts.expiresInSeconds, 604800)))

  const signed = await client.sign(url.toString(), {
    method: 'GET',
    aws: { signQuery: true },
  })

  return signed.url
}
