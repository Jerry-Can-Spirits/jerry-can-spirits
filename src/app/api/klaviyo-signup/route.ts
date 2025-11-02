// app/api/klaviyo-signup/route.ts
import { NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'
export const dynamic = 'force-dynamic' // ensure no static optimization

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'

// Simple in-memory rate limiting (best-effort on Edge)
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5 // Max 5 signups per minute per IP

interface SignupBody {
  firstName: string
  email: string
  interests?: string[]
  listId?: string
  website?: string // honeypot
}

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext()
    const KLAVIYO_PRIVATE_KEY = env.KLAVIYO_PRIVATE_KEY as string | undefined

    let body: SignupBody
    try {
      body = (await request.json()) as SignupBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { firstName, email, interests = [], listId, website } = body

    // Honeypot check
    if (website && website.trim() !== '') {
      console.log('Honeypot triggered - potential bot signup blocked')
      return NextResponse.json({ success: true, message: 'Thank you for signing up!' })
    }

    // Rate limiting
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

    if (!firstName || !email) {
      return NextResponse.json({ error: 'First name and email are required' }, { status: 400 })
    }

    if (!KLAVIYO_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Klaviyo API key not configured' }, { status: 500 })
    }

    const commonHeaders = {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: '2024-10-15',
    }

    // Create or update profile in Klaviyo
    const profilePayload = {
      data: {
        type: 'profile',
        attributes: {
          email,
          first_name: firstName,
          properties: {
            interests,
            signup_source: 'website_newsletter',
            signup_date: new Date().toISOString(),
          },
        },
      },
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
      // Profile exists—look up ID and patch properties
      const filter = encodeURIComponent(`equals(email,"${email}")`)
      const searchRes = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
        headers: commonHeaders as Record<string, string>,
      })
      if (searchRes.ok) {
        const data = await searchRes.json()
        if (data.data && data.data.length > 0) {
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
                    interests,
                    last_signup_date: new Date().toISOString(),
                  },
                },
              },
            }),
          })
        }
      }
    } else {
      const errorData = await profileResponse.text()
      console.error('Klaviyo profile creation failed:', errorData)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Subscribe profile to a list if provided
    if (listId && profileId) {
      const subscriptionPayload = {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  id: profileId,
                  attributes: {
                    email,
                    subscriptions: {
                      email: {
                        marketing: {
                          consent: 'SUBSCRIBED',
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
          relationships: {
            list: { data: { type: 'list', id: listId } },
          },
        },
      }

      const subscriptionResponse = await fetch(
        `${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs/`,
        {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(subscriptionPayload),
        }
      )

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.text()
        console.error('Klaviyo subscription failed:', errorData)
        // non-blocking
      }
    }

    // Track signup event (best-effort)
    const eventPayload = {
      data: {
        type: 'event',
        attributes: {
          properties: {
            interests,
            signup_source: 'website_newsletter',
          },
          metric: {
            data: {
              type: 'metric',
              attributes: { name: 'Newsletter Signup' },
            },
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email,
                first_name: firstName,
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
      const err = await eventRes.text()
      console.error('Klaviyo signup event failed:', err)
      // non-blocking
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Klaviyo signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
