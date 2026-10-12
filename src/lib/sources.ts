// The sources a page lists at its foot (the `source` object in Sanity), and
// the two things done with them: the visible list and the Article citation.

export interface Source {
  title: string
  publisher: string
  url: string
  accessed: string
  note?: string
}

// A Sanity date is a bare YYYY-MM-DD. Read as UTC and formatted in UTC, or a
// reader west of Greenwich sees the day before.
export function formatAccessed(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// The schema requires every field, but a draft published mid-edit or a
// script write can still leave one out. An entry the reader cannot follow is
// not a source, so it is dropped rather than rendered half-formed.
export function listableSources(sources: (Partial<Source> | null)[] | null | undefined): Source[] {
  return (sources ?? []).filter(
    (s): s is Source =>
      typeof s?.title === 'string' && s.title.trim() !== '' &&
      typeof s.publisher === 'string' && s.publisher.trim() !== '' &&
      typeof s.url === 'string' && /^https?:\/\//.test(s.url) &&
      typeof s.accessed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.accessed),
  )
}

export function sourceCitations(sources: Source[]) {
  return sources.map((s) => ({
    '@type': 'CreativeWork',
    name: s.title,
    url: s.url,
    publisher: { '@type': 'Organization', name: s.publisher },
  }))
}
