import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

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

// Simple in-memory rate limiting (best-effort on Edge)
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 3 // Max 3 requests/min per IP

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()
    const KLAVIYO_PRIVATE_KEY = env.KLAVIYO_PRIVATE_KEY as string | undefined

    let formData: ContactFormData
    try {
      formData = (await request.json()) as ContactFormData
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, email, subject, message, formType, orderNumber, issueType, priority, website } = formData

    // Honeypot
    if (website && website.trim() !== '') {
      return NextResponse.json({ success: true, message: 'Your message has been received.' })
    }

    // Rate limit
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
    if (!KLAVIYO_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Klaviyo API key not configured' }, { status: 500 })
    }

    // Event details
    let eventName = 'Contact Form Submission'
    const properties: Record<string, unknown> = {
      subject,
      message,
      form_type: formType,
      submission_date: new Date().toISOString(),
      source: 'website_contact_form',
    }
    switch (formType) {
      case 'media':
        ;(properties as any).inquiry_type = 'media'
        eventName = 'Media Inquiry'
        break
      case 'complaints':
        ;(properties as any).inquiry_type = 'complaint'
        if (orderNumber) (properties as any).order_number = orderNumber
        if (issueType) (properties as any).issue_type = issueType
        if (priority) (properties as any).priority = priority
        eventName = 'Customer Complaint'
        break
      default:
        ;(properties as any).inquiry_type = 'general'
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
      const filter = encodeURIComponent(`equals(email,"${email}")`)
      const findRes = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
        headers: commonHeaders as Record<string, string>,
      })
      if (findRes.ok) {
        const data = await findRes.json()
        if (data.data?.length) {
          profileId = data.data[0].id
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

    // Track event (best-effort)
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

    const eventRes = await fetch(`${KLAVIYO_API_BASE}/events/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(eventPayload),
    })
    if (!eventRes.ok) {
      console.error('Klaviyo event tracking failed:', await eventRes.text())
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been received. We'll get back to you within 24 hours.",
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
