import { NextRequest, NextResponse } from 'next/server'

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  formType: 'general' | 'media' | 'complaints'
  orderNumber?: string
  issueType?: string
  priority?: string
  // Honeypot field - should always be empty
  website?: string
}

// Simple in-memory rate limiting (production should use Redis/Upstash)
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 3 // Max 3 requests per minute per IP

export async function POST(request: NextRequest) {
  try {
    const formData: ContactFormData = await request.json()

    const { name, email, subject, message, formType, orderNumber, issueType, priority, website } = formData

    // Honeypot check - if 'website' field is filled, it's likely a bot
    if (website && website.trim() !== '') {
      console.log('Honeypot triggered - potential bot submission blocked')
      // Return success to avoid revealing the honeypot
      return NextResponse.json({
        success: true,
        message: 'Your message has been received.'
      })
    }

    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const timestamps = submissionTimestamps.get(ip) || []
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

    if (recentTimestamps.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    recentTimestamps.push(now)
    submissionTimestamps.set(ip, recentTimestamps)

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      )
    }

    if (!KLAVIYO_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Klaviyo API key not configured' },
        { status: 500 }
      )
    }

    // Determine event name and properties based on form type
    let eventName = 'Contact Form Submission'
    const properties: Record<string, unknown> = {
      subject,
      message,
      form_type: formType,
      submission_date: new Date().toISOString(),
      source: 'website_contact_form'
    }

    switch (formType) {
      case 'media':
        eventName = 'Media Inquiry'
        properties.inquiry_type = 'media'
        break
      case 'complaints':
        eventName = 'Customer Complaint'
        properties.inquiry_type = 'complaint'
        if (orderNumber) properties.order_number = orderNumber
        if (issueType) properties.issue_type = issueType
        if (priority) properties.priority = priority
        break
      default:
        properties.inquiry_type = 'general'
    }

    // Create or update profile in Klaviyo
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
            preferred_contact_method: 'email'
          }
        }
      }
    }

    let profileId: string | undefined

    const profileResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(profilePayload)
    })

    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      profileId = profileData.data.id
    } else if (profileResponse.status === 409) {
      // Profile already exists, get the profile ID
      const profileSearchResponse = await fetch(
        `${KLAVIYO_API_BASE}/profiles/?filter=equals(email,"${email}")`,
        {
          headers: {
            'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
            'revision': '2024-10-15'
          }
        }
      )

      if (profileSearchResponse.ok) {
        const searchData = await profileSearchResponse.json()
        if (searchData.data && searchData.data.length > 0) {
          profileId = searchData.data[0].id

          // Update existing profile with contact info
          await fetch(`${KLAVIYO_API_BASE}/profiles/${profileId}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
              'Content-Type': 'application/json',
              'revision': '2024-10-15'
            },
            body: JSON.stringify({
              data: {
                type: 'profile',
                id: profileId,
                attributes: {
                  properties: {
                    last_contact_date: new Date().toISOString(),
                    last_contact_type: formType,
                  }
                }
              }
            })
          })
        }
      }
    } else {
      const errorData = await profileResponse.text()
      console.error('Klaviyo profile creation failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Track contact form event
    const eventPayload = {
      data: {
        type: 'event',
        attributes: {
          properties,
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: eventName
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email,
                first_name: name.split(' ')[0],
                last_name: name.split(' ').slice(1).join(' ') || ''
              }
            }
          }
        }
      }
    }

    const eventResponse = await fetch(`${KLAVIYO_API_BASE}/events/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(eventPayload)
    })

    if (!eventResponse.ok) {
      const errorData = await eventResponse.text()
      console.error('Klaviyo event tracking failed:', errorData)
      // Don't fail the request if event tracking fails
    }

    // Send notification email (you can implement this later with SendGrid/Resend)
    // For now, we'll just log the submission
    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      formType,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We\'ll get back to you within 24 hours.'
    })

  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}