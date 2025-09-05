import { NextRequest, NextResponse } from 'next/server'

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY

export async function POST(request: NextRequest) {
  try {
    const { firstName, email, interests, listId, apiKey } = await request.json()

    if (!firstName || !email) {
      return NextResponse.json(
        { error: 'First name and email are required' },
        { status: 400 }
      )
    }

    if (!KLAVIYO_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Klaviyo API key not configured' },
        { status: 500 }
      )
    }

    // Create or update profile in Klaviyo
    const profilePayload = {
      data: {
        type: 'profile',
        attributes: {
          email,
          first_name: firstName,
          properties: {
            interests: interests || [],
            signup_source: 'website_newsletter',
            signup_date: new Date().toISOString(),
          }
        }
      }
    }

    const profileResponse = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(profilePayload)
    })

    let profileId: string | undefined

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
          
          // Update existing profile with new interests
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
                    interests: interests || [],
                    last_signup_date: new Date().toISOString(),
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

    // Subscribe to list if listId provided
    if (listId && profileId) {
      const subscriptionPayload = {
        data: [
          {
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
                            consent: 'SUBSCRIBED'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: listId
                }
              }
            }
          }
        ]
      }

      const subscriptionResponse = await fetch(
        `${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
            'revision': '2024-10-15'
          },
          body: JSON.stringify(subscriptionPayload)
        }
      )

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.text()
        console.error('Klaviyo subscription failed:', errorData)
        // Don't fail the whole request if subscription fails
      }
    }

    // Track signup event
    const eventPayload = {
      data: {
        type: 'event',
        attributes: {
          properties: {
            interests: interests || [],
            signup_source: 'website_newsletter'
          },
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'Newsletter Signup'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email,
                first_name: firstName
              }
            }
          }
        }
      }
    }

    await fetch(`${KLAVIYO_API_BASE}/events/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(eventPayload)
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Klaviyo signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}