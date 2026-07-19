// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isRateLimited, isAllowedOrigin } from '@/lib/kv'
import { emailDomainAcceptsMail } from '@/lib/email-validation'
import { hashEmail } from '@/lib/meta-capi'
import { sendEmail } from '@/lib/resend'

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'

interface ContactFormData {
  name: string
  email: string
  subject?: string
  message: string
  formType: 'general' | 'media' | 'complaints' | 'trade'
  // trade-specific
  venueName?: string
  venueType?: string
  covers?: string
  // existing optional fields
  orderNumber?: string
  issueType?: string
  priority?: string
  website?: string // honeypot
}

interface EventProperties {
  subject: string
  message?: string
  form_type: string
  submission_date: string
  source: string
  inquiry_type?: string
  order_number?: string
  issue_type?: string
  priority?: string
  // trade-specific
  venue_name?: string
  venue_type?: string
  covers?: string
}

const CONTACT_RATE_LIMIT = 3 // requests per minute per IP

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false
  const at = email.indexOf('@')
  if (at < 1 || at !== email.lastIndexOf('@')) return false
  const domain = email.slice(at + 1)
  const dot = domain.lastIndexOf('.')
  if (dot < 1 || dot === domain.length - 1) return false
  if (domain.slice(dot + 1).length < 2) return false
  return true
}

async function buildEmailIdentityCookie(email: string, request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const hasFbp = /(?:^|;\s*)_fbp=/.test(cookieHeader)
  if (!hasFbp) return null
  const hashed = await hashEmail(email)
  return `jcs_em=${hashed}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7776000`
}

// Verified Resend sender (also used by the trade-application route).
const FROM_EMAIL = 'hello@jerrycanspirits.co.uk'

interface ContactNotifyData {
  name: string
  email: string
  formType: ContactFormData['formType']
  subject?: string
  message?: string
  orderNumber?: string
  issueType?: string
  priority?: string
  venueName?: string
  venueType?: string
  covers?: string
}

// Fire the Klaviyo profile + event for a submission. Best-effort: the message is
// already durably stored in D1 before this runs, so a failure here is logged and
// never surfaced to the customer (it can throw; the caller swallows it).
async function sendKlaviyoNotification(
  klaviyoKey: string | undefined,
  data: ContactNotifyData,
): Promise<void> {
  if (!klaviyoKey) {
    console.warn('[contact] KLAVIYO_PRIVATE_KEY not configured — skipping Klaviyo notify')
    return
  }
  const { name, email, formType } = data

  let eventName = 'Contact Form Submission'
  const properties: EventProperties = {
    subject: data.subject ?? '',
    ...(data.message ? { message: data.message } : {}),
    form_type: formType,
    submission_date: new Date().toISOString(),
    source: 'website_contact_form',
  }
  switch (formType) {
    case 'media':
      properties.inquiry_type = 'media'
      eventName = 'Media Inquiry'
      break
    case 'complaints':
      properties.inquiry_type = 'complaint'
      if (data.orderNumber) properties.order_number = data.orderNumber
      if (data.issueType) properties.issue_type = data.issueType
      if (data.priority) properties.priority = data.priority
      eventName = 'Customer Complaint'
      break
    case 'trade':
      properties.inquiry_type = 'trade'
      properties.subject = 'Trade Enquiry'
      eventName = 'Trade Enquiry'
      properties.venue_name = data.venueName
      properties.venue_type = data.venueType
      properties.covers = data.covers
      if (data.message) properties.message = data.message
      break
    default:
      properties.inquiry_type = 'general'
  }

  const commonHeaders = {
    Authorization: `Klaviyo-API-Key ${klaviyoKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    revision: '2024-10-15',
  }

  // Create/update the profile (the event auto-creates one too, but we own the
  // call to control the attribute payload). Non-fatal — logged, not thrown.
  const profileResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes: {
          email,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' ') || '',
          properties: {
            last_contact_date: new Date().toISOString(),
            contact_form_submissions: 1,
          },
        },
      },
    }),
  })

  if (profileResponse.status === 409 && /^[A-Za-z0-9.@_+-]+$/.test(email)) {
    // Already exists: look up by email. Strict allowlist above before we
    // interpolate the email into the filter (see klaviyo-signup route).
    const filter = encodeURIComponent(`equals(email,"${email}")`)
    const profileSearchResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
      headers: commonHeaders as Record<string, string>,
    })
    if (profileSearchResponse.ok) {
      const searchData = (await profileSearchResponse.json()) as { data?: { id?: string }[] }
      const profileId = searchData.data?.[0]?.id
      if (profileId && /^[\w-]+$/.test(profileId)) {
        await fetch(`${KLAVIYO_API_BASE}/profiles/${profileId}/`, {
          method: 'PATCH',
          headers: commonHeaders,
          body: JSON.stringify({
            data: {
              type: 'profile',
              id: profileId,
              attributes: {
                properties: {
                  last_contact_date: new Date().toISOString(),
                  last_contact_type: formType,
                },
              },
            },
          }),
        })
      }
    }
  } else if (!profileResponse.ok) {
    console.error('[contact] Klaviyo profile create failed:', await profileResponse.text())
  }

  // Fire the event (drives the team-notification flow). Non-fatal.
  const eventResponse = await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          properties,
          metric: { data: { type: 'metric', attributes: { name: eventName } } },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email,
                first_name: name.split(' ')[0],
                last_name: name.split(' ').slice(1).join(' ') || '',
              },
            },
          },
        },
      },
    }),
  })
  if (!eventResponse.ok) {
    console.error('[contact] Klaviyo event failed:', await eventResponse.text())
  }
}

// Alert a human that a submission arrived, via Resend. Best-effort and
// ships dark: the D1 row is the durable record, so if CONTACT_ALERT_EMAIL /
// RESEND_API_KEY are unset the alert is skipped and logged, not fatal.
async function sendContactAlert(env: CloudflareEnv, data: ContactNotifyData): Promise<void> {
  const to = env.CONTACT_ALERT_EMAIL
  const apiKey = env.RESEND_API_KEY as string | undefined
  if (!to || !apiKey) {
    console.warn('[contact] CONTACT_ALERT_EMAIL/RESEND_API_KEY not configured — skipping alert')
    return
  }

  const rows = [
    `Form type: ${data.formType}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.subject ? `Subject: ${data.subject}` : '',
    data.venueName ? `Venue: ${data.venueName} (${data.venueType ?? ''}, ${data.covers ?? ''} covers)` : '',
    data.orderNumber ? `Order number: ${data.orderNumber}` : '',
    data.issueType ? `Issue type: ${data.issueType}` : '',
    data.priority ? `Priority: ${data.priority}` : '',
    data.message ? `\nMessage:\n${data.message}` : '',
  ].filter(Boolean)
  const text = rows.join('\n')
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${esc(text)}</pre>`

  const result = await sendEmail({
    apiKey,
    from: FROM_EMAIL,
    to,
    replyTo: data.email, // replying to the alert emails the customer back
    subject: `[${data.formType}] Contact form — ${data.name}`,
    html,
    text,
  })
  if (!result.ok) {
    console.error('[contact] Resend alert failed:', result.error)
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Read Workers env vars from Cloudflare context
    const { env } = await getCloudflareContext()
    const KLAVIYO_PRIVATE_KEY = env.KLAVIYO_PRIVATE_KEY as string | undefined
    const kv = env.SITE_OPS as KVNamespace

    let formData: ContactFormData
    try {
      formData = (await request.json()) as ContactFormData
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      name: rawName,
      email: rawEmail,
      subject,
      message,
      formType,
      orderNumber,
      issueType,
      priority,
      website,
      venueName,
      venueType,
      covers,
    } = formData

    const name = rawName?.trim() ?? ''
    const email = rawEmail?.trim().toLowerCase() ?? ''

    // Honeypot check
    if (website && website.trim() !== '') {
      // Silently accept to avoid tipping off bots
      return NextResponse.json({ success: true, message: 'Your message has been received.' })
    }

    // Rate limiting via KV (works across all Worker isolates)
    const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
    if (await isRateLimited(kv, 'contact', ip, CONTACT_RATE_LIMIT, 60)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    if (formType === 'trade') {
      if (!name || !email || !venueName || !venueType || !covers) {
        return NextResponse.json({ error: 'Name, email, venue name, venue type, and covers are required' }, { status: 400 })
      }
    } else {
      if (!name || !email || !subject || !message) {
        return NextResponse.json({ error: 'Name, email, subject, and message are required' }, { status: 400 })
      }
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Verify the domain actually accepts mail. Catches typos and fake
    // domains that pass syntax validation (e.g. user@notarealdomain.xyz).
    if (!(await emailDomainAcceptsMail(email))) {
      return NextResponse.json({ error: 'That email domain does not appear to accept mail. Please check and try again.' }, { status: 400 })
    }

    // Persist the submission durably FIRST — this D1 write is the success gate.
    // The message is committed before any third party is contacted, so a Klaviyo
    // or Resend outage can no longer lose it. Nothing below returns an error.
    try {
      await env.DB
        .prepare(
          `INSERT INTO contact_submissions
             (form_type, name, email, subject, message, order_number, issue_type, priority, venue_name, venue_type, covers)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          formType,
          name,
          email,
          subject ?? null,
          message ?? null,
          orderNumber ?? null,
          issueType ?? null,
          priority ?? null,
          venueName ?? null,
          venueType ?? null,
          covers ?? null,
        )
        .run()
    } catch (err) {
      console.error('[contact] durable write to D1 failed:', err)
      return NextResponse.json(
        { error: 'We could not save your message. Please try again.' },
        { status: 500 },
      )
    }

    // Everything below is best-effort and must never change the response: the
    // customer is only told "received" once the message is genuinely durable.
    const notify: ContactNotifyData = {
      name,
      email,
      formType,
      subject,
      message,
      orderNumber,
      issueType,
      priority,
      venueName,
      venueType,
      covers,
    }
    await sendKlaviyoNotification(KLAVIYO_PRIVATE_KEY, notify).catch((e) =>
      console.error('[contact] Klaviyo notify failed (non-fatal):', e),
    )
    await sendContactAlert(env, notify).catch((e) =>
      console.error('[contact] alert failed (non-fatal):', e),
    )

    console.log('Contact form submission received:', { formType, timestamp: new Date().toISOString() })

    const response = NextResponse.json({
      success: true,
      message: "Your message has been received. We'll get back to you within 24 hours.",
    })
    try {
      const identityCookie = await buildEmailIdentityCookie(email, request)
      if (identityCookie) response.headers.append('Set-Cookie', identityCookie)
    } catch {
      // Hash failure is non-fatal. Contact submission itself succeeded.
    }
    return response
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
