declare global {
  interface Window {
    fbq?: (
      track: string,
      event: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void
    Cookiebot?: { consent?: { marketing?: boolean } }
  }
}

export interface MetaEventBody {
  eventName: string
  eventID: string
  eventTime: number
  eventSourceUrl: string
  customData: Record<string, unknown>
}

export async function hashEmail(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase()
  const data = new TextEncoder().encode(normalised)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function trackEventDual(
  eventName: string,
  customData: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return
  if (!window.Cookiebot?.consent?.marketing) return

  const eventID = crypto.randomUUID()
  const eventTime = Math.floor(Date.now() / 1000)
  const eventSourceUrl = window.location.href

  if (window.fbq) {
    window.fbq('track', eventName, customData, { eventID })
  }

  const body: MetaEventBody = {
    eventName,
    eventID,
    eventTime,
    eventSourceUrl,
    customData,
  }

  fetch('/api/meta/events/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Pixel leg already fired. Server-side failure is invisible to the user.
  })
}

export {}
