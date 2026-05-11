interface ResendAttachment {
  filename: string
  /** Base64-encoded file contents */
  content: string
  /** MIME type, e.g. 'text/calendar' */
  contentType: string
}

interface SendEmailOptions {
  apiKey: string
  from: string
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
  attachments?: ResendAttachment[]
}

export interface SendEmailResult {
  id?: string
  ok: boolean
  error?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const body: Record<string, unknown> = {
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  }
  if (opts.replyTo) body.reply_to = opts.replyTo
  if (opts.attachments && opts.attachments.length > 0) {
    body.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      content_type: a.contentType,
    }))
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return { ok: false, error: `Resend ${response.status}: ${errorText}` }
  }

  const data = (await response.json()) as { id?: string }
  return { ok: true, id: data.id }
}

/** Encode a UTF-8 string to base64 (Worker-compatible). */
export function toBase64(input: string): string {
  // btoa cannot handle non-Latin1 — encode through TextEncoder first.
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}
