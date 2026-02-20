// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  formType: 'general' | 'media' | 'complaints'
  orderNumber?: string
  issueType?: string
  priority?: string
  website?: string // honeypot
}

interface EventProperties {
  subject: string
  message: string
  form_type: string
  submission_date: string
  source: string
  inquiry_type?: string
  order_number?: string
  issue_type?: string
  priority?: string
}

// Simple in-memory rate limiting (best-effort only on Edge)
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 3 // Max 3 requests/min per IP

// Email validation function
function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Additional checks for common invalid patterns
  if (!emailRegex.test(email)) return false
  if (email.length > 254) return false // Max email length per RFC

  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return false
  if (localPart.length > 64) return false // Max local part length

  // Check for invalid characters
  if (email.includes('..')) return false // No consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false

  // Check domain has valid TLD
  const domainParts = domain.split('.')
  if (domainParts.length < 2) return false
  if (domainParts[domainParts.length - 1].length < 2) return false

  return true
}

export async function POST(request: Request) {
  try {
    // Read Workers env vars from Cloudflare context
    const { env } = await getCloudflareContext()
    const KLAVIYO_PRIVATE_KEY = env.KLAVIYO_PRIVATE_KEY as string | undefined

    let formData: ContactFormData
    try {
      formData = (await request.json()) as ContactFormData
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, email, subject, message, formType, orderNumber, issueType, priority, website } = formData

    // Honeypot check
    if (website && website.trim() !== '') {
      // Silently accept to avoid tipping off bots
      return NextResponse.json({ success: true, message: 'Your message has been received.' })
    }

    // Rate limiting (best-effort in-memory)
    const fwd = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const ip = fwd.split(',')[0].trim()
    const now = Date.now()
    const timestamps = submissionTimestamps.get(ip) || []
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

    if (recent.length >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    recent.push(now)
    submissionTimestamps.set(ip, recent)

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Name, email, subject, and message are required' }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (!KLAVIYO_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Klaviyo API key not configured' }, { status: 500 })
    }

    // Build event details
    let eventName = 'Contact Form Submission'
    const properties: EventProperties = {
      subject,
      message,
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
      default:
        properties.inquiry_type = 'general'
    }

    // Create or update profile
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
            preferred_contact_method: 'email',
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
      const profileData = await profileResponse.json()
      profileId = profileData.data?.id
    } else if (profileResponse.status === 409) {
      // Already exists: look up by email
      const filter = encodeURIComponent(`equals(email,"${email}")`)
      const profileSearchResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
        headers: commonHeaders as Record<string, string>,
      })
      if (profileSearchResponse.ok) {
        const searchData = await profileSearchResponse.json()
        if (searchData.data && searchData.data.length > 0) {
          profileId = searchData.data[0].id
          // Patch properties
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

    // Log (non-sensitive)
    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      formType,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Your message has been received. We'll get back to you within 24 hours.",
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
