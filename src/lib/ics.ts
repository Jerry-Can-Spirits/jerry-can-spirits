// Generate an RFC 5545 .ics calendar invite for a single all-day event.
// Used to attach yearly trade review reminders to admin notification emails.

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
}

function formatIcsDate(d: Date): string {
  // YYYYMMDD format for all-day events
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function formatIcsStamp(d: Date): string {
  // YYYYMMDDTHHMMSSZ
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

export function generateIcs(event: IcsEvent): string {
  const dtStart = formatIcsDate(event.startUtc)
  const dtEndDate = new Date(event.startUtc)
  dtEndDate.setUTCDate(dtEndDate.getUTCDate() + 1)
  const dtEnd = formatIcsDate(dtEndDate)
  const stamp = formatIcsStamp(new Date())

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jerry Can Spirits//Trade Review//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@jerrycanspirits.co.uk`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `ORGANIZER:mailto:${event.organizerEmail}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
