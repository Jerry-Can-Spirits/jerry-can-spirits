import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ ticket: string }> }) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') return new Response('Unauthorized', { status: 401 })
  if (access.kind === 'no-licence') return new Response('Forbidden', { status: 403 })
  const { ticket } = await params
  // Pending files are not tenant-tagged in R2; the gate is a licensed session +
  // the unguessable upload ticket. Acceptable for a short-lived pre-commit doc.
  const { env } = await getCloudflareContext()
  const r2 = env.TRADE_DOCS as R2Bucket
  const obj = await r2.get(`pouriq-invoices/_pending/${ticket}.pdf`)
  if (!obj) return new Response('Not found', { status: 404 })
  return new Response(obj.body, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="invoice.pdf"',
      'cache-control': 'private, no-store',
    },
  })
}
