// Generate an RFC 5545 .ics calendar invite for a single all-day event.
// Used to attach yearly trade review reminders to admin notification emails.
//
// METHOD:REQUEST + ATTENDEE makes most clients (Outlook, Apple Mail, Gmail web)
// render an inline Accept button rather than requiring manual import.

export interface IcsEvent {
  /** UTC timestamp of the event (we use an all-day event keyed off this date) */
  startUtc: Date
  /** Event title shown in the calendar */
  title: string
  /** Long-form description (newlines are escaped) */
  description: string
  /** Stable unique identifier (use the application ID) */
  uid: string
  /** Mail address shown as organiser */
  organizerEmail: string
  /** Mail address of the attendee — receives the inline Accept widget */
  attendeeEmail: string
}

function formatIcsDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function formatIcsStamp(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${day}T${hh}${mm}${ss}Z`
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

// RFC 5545 line folding: content lines must not exceed 75 octets.
// Continuation lines begin with a single space; receivers reassemble by
// stripping CRLF+space. Octet count is measured in UTF-8 bytes.
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const out: string[] = []
  let remaining = line
  let first = true
  while (remaining.length > 0) {
    const limit = first ? 75 : 74 // leading space on continuations counts
    let cut = remaining.length
    while (encoder.encode(remaining.slice(0, cut)).length > limit) cut--
    out.push(first ? remaining.slice(0, cut) : ' ' + remaining.slice(0, cut))
    remaining = remaining.slice(cut)
    first = false
  }
  return out.join('\r\n')
}

export function generateIcs(event: IcsEvent): string {
  const dtStart = formatIcsDate(event.startUtc)
  const dtEndDate = new Date(event.startUtc)
  dtEndDate.setUTCDate(dtEndDate.getUTCDate() + 1)
  const dtEnd = formatIcsDate(dtEndDate)
  const stamp = formatIcsStamp(new Date())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jerry Can Spirits//Trade Review//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${event.uid}@jerrycanspirits.co.uk`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `ORGANIZER:mailto:${event.organizerEmail}`,
    `ATTENDEE;CN=Trade Reviews;RSVP=FALSE;PARTSTAT=NEEDS-ACTION:mailto:${event.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
