// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isRateLimited, isAllowedOrigin } from '@/lib/kv'
import { emailDomainAcceptsMail } from '@/lib/email-validation'

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

    if (!KLAVIYO_PRIVATE_KEY) {
      console.error('[contact] KLAVIYO_PRIVATE_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    // Build event details
    let eventName = 'Contact Form Submission'
    const properties: EventProperties = {
      subject: subject ?? '',
      ...(message ? { message } : {}),
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
        if (orderNumber) properties.order_number = orderNumber
        if (issueType) properties.issue_type = issueType
        if (priority) properties.priority = priority
        eventName = 'Customer Complaint'
        break
      case 'trade':
        properties.inquiry_type = 'trade'
        properties.subject = 'Trade Enquiry'
        eventName = 'Trade Enquiry'
        properties.venue_name = venueName
        properties.venue_type = venueType
        properties.covers = covers
        if (message) properties.message = message
        break
      default:
        properties.inquiry_type = 'general'
    }

    // Create or update profile. Profile creation is unavoidable in Klaviyo
    // when sending an event with an email (it auto-creates one), so we own
    // the create call to control attribute payloads. We deliberately do NOT
    // set marketing-flavoured properties (preferred_contact_method,
    // marketing tags) or include any subscriptions block — those would
    // need explicit Article 6/7 marketing consent. last_contact_date and
    // contact_form_submissions are transactional (replying to an inquiry).
    const profilePayload = {
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
    }

    const commonHeaders = {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: '2024-10-15',
    }

    let profileId: string | undefined

    const profileResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(profilePayload),
    })

    if (profileResponse.ok) {
      const profileData = await profileResponse.json() as { data?: { id?: string } }
      profileId = profileData.data?.id
    } else if (profileResponse.status === 409) {
      // Already exists: look up by email.
      // Strict allowlist before substitution — see klaviyo-signup route for rationale.
      if (!/^[A-Za-z0-9.@_+-]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      const filter = encodeURIComponent(`equals(email,"${email}")`)
      const profileSearchResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
        headers: commonHeaders as Record<string, string>,
      })
      if (profileSearchResponse.ok) {
        const searchData = await profileSearchResponse.json() as { data?: { id?: string }[] }
        if (searchData.data && searchData.data.length > 0) {
          profileId = searchData.data[0].id
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
      }
    } else {
      const errorText = await profileResponse.text()
      console.error('Klaviyo profile creation failed:', errorText)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Track contact form event (best-effort)
    const eventPayload = {
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
    }

    const eventResponse = await fetch(`${KLAVIYO_API_BASE}/events/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(eventPayload),
    })

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text()
      console.error('Klaviyo event tracking failed:', errorText)
      // Non-blocking
    }

    console.log('Contact form submission received:', { formType, timestamp: new Date().toISOString() })

    return NextResponse.json({
      success: true,
      message: "Your message has been received. We'll get back to you within 24 hours.",
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
