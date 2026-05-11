// Weekly cron: email the founder a digest of trade accounts due for review.
// Triggered by wrangler.jsonc `triggers.crons` schedule "0 8 * * 1".
//
// This module is imported by cloudflare-worker-entry.mjs and runs in the
// Worker isolate; getCloudflareContext() is NOT available here — env is
// passed in directly by the scheduled handler.

import { getApplicationsDueForReview } from './trade-applications'
import { sendEmail } from './resend'

interface ScheduledEnv {
  DB: D1Database
  RESEND_API_KEY: string
  TRADE_APPLICATIONS_EMAIL: string
}

const REVIEW_WINDOW_DAYS = 30
const FROM_EMAIL = 'Jerry Can Spirits <applications@send.jerrycanspirits.co.uk>'

export async function runTradeReviewDigest(env: ScheduledEnv): Promise<void> {
  const due = await getApplicationsDueForReview(env.DB, REVIEW_WINDOW_DAYS)
  if (due.length === 0) return // silent — nothing to email

  const now = Date.now()
  const rows = due.map((row) => {
    const reviewDate = new Date(row.next_review_date)
    const days = Math.max(0, Math.ceil((reviewDate.getTime() - now) / (1000 * 60 * 60 * 24)))
    return `<tr>
      <td style="padding:6px 12px 6px 0">${escapeHtml(row.trading_name)}</td>
      <td style="padding:6px 12px 6px 0">${escapeHtml(row.contact_email)}</td>
      <td style="padding:6px 12px 6px 0">${row.next_review_date.split('T')[0]}</td>
      <td style="padding:6px 0">${days}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;color:#0a0a0a;max-width:680px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">Trade reviews due (${due.length})</h1>
<p style="color:#5a6168;margin:0 0 16px">The following trade accounts are due for AWRS due diligence review within the next ${REVIEW_WINDOW_DAYS} days.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
  <thead><tr style="border-bottom:1px solid #d1d5db;text-align:left">
    <th style="padding:6px 12px 6px 0">Trading name</th>
    <th style="padding:6px 12px 6px 0">Contact email</th>
    <th style="padding:6px 12px 6px 0">Review date</th>
    <th style="padding:6px 0">Days</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`

  const text = [
    `Trade reviews due (${due.length})`,
    '',
    ...due.map((row) => `${row.trading_name} · ${row.contact_email} · ${row.next_review_date.split('T')[0]}`),
  ].join('\n')

  await sendEmail({
    apiKey: env.RESEND_API_KEY,
    from: FROM_EMAIL,
    to: env.TRADE_APPLICATIONS_EMAIL,
    subject: `Trade reviews due (${due.length} account${due.length === 1 ? '' : 's'})`,
    html,
    text,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
