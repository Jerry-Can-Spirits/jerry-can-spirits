// Postcode to licensing authority, via postcodes.io.
//
// WHY. The first real trade application gave its licensing authority as
// "hereford council". The authority is Herefordshire Council, and the two are
// different bodies in the sense that matters — one of them exists. The venue's
// own trading postcode resolves to the right answer with no ambiguity:
//
//     HR1 2LR -> admin_district: "Herefordshire, County of"
//
// This was Josh's idea and it is a good one. A dropdown driven by the postcode
// removes a free-text field that nobody can reliably fill in, including people
// who have held a premises licence for years, because the licensing authority's
// legal name is rarely what anyone calls it locally.
//
// postcodes.io is free, needs no key, and is built on ONS data. There is no
// commercial dependency here worth worrying about, and a failed lookup degrades
// to the user typing it themselves rather than blocking the application.

const API = 'https://api.postcodes.io/postcodes'

export interface PostcodeRecord {
  postcode: string
  /** The local authority. For licensing purposes this is the issuing body. */
  admin_district: string
  admin_county: string | null
  region: string | null
  country: string | null
}

export type PostcodeResult =
  | { outcome: 'match'; record: PostcodeRecord; raw: unknown }
  | { outcome: 'not_found' }
  | { outcome: 'error'; message: string }

/** UK postcode shape, loose enough to accept anything postcodes.io will. */
export function looksLikePostcode(input: string): boolean {
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i.test(input.trim())
}

export async function lookupPostcode(postcode: string): Promise<PostcodeResult> {
  const value = postcode.trim()
  if (!looksLikePostcode(value)) return { outcome: 'error', message: 'Not a valid UK postcode format' }

  let response: Response
  try {
    response = await fetch(`${API}/${encodeURIComponent(value)}`, { headers: { Accept: 'application/json' } })
  } catch (e) {
    return { outcome: 'error', message: e instanceof Error ? e.message : 'Request failed' }
  }

  if (response.status === 404) return { outcome: 'not_found' }
  if (!response.ok) return { outcome: 'error', message: `postcodes.io returned ${response.status}` }

  let raw: { result?: Record<string, unknown> }
  try {
    raw = (await response.json()) as { result?: Record<string, unknown> }
  } catch {
    return { outcome: 'error', message: 'postcodes.io returned unparseable JSON' }
  }

  const result = raw.result
  if (!result || typeof result.admin_district !== 'string') return { outcome: 'not_found' }

  return {
    outcome: 'match',
    raw,
    record: {
      postcode: String(result.postcode ?? value),
      admin_district: result.admin_district,
      admin_county: typeof result.admin_county === 'string' ? result.admin_county : null,
      region: typeof result.region === 'string' ? result.region : null,
      country: typeof result.country === 'string' ? result.country : null,
    },
  }
}

/**
 * The administrative area, with the ONS inversion undone.
 *
 * ONS writes several areas in inverted form — "Herefordshire, County of",
 * "Bristol, City of" — which is right in a statistical dataset and wrong on a
 * form. This returns "Herefordshire" and "Bristol".
 *
 * IT DELIBERATELY DOES NOT RETURN A COUNCIL NAME. The obvious next step is to
 * append "Council" and offer "Herefordshire Council", which is correct here and
 * wrong often enough to matter: real authorities include Bristol City Council,
 * Cheshire West and Chester Council, Kingston upon Hull City Council and County
 * Durham's Durham County Council, and no suffix rule produces all of them. The
 * first version of this function returned "County of Herefordshire", which is
 * the county rather than the licensing authority — a wrong answer wearing a
 * more official-looking coat than the "hereford council" it replaced.
 *
 * So the area is presented as the suggestion and the venue confirms it. The
 * value is in narrowing 300-odd authorities to one candidate, not in pretending
 * to know its legal name.
 */
export function administrativeArea(adminDistrict: string): string {
  const inverted = /^(.+),\s*(?:County|City|Borough|Royal Borough) of$/i.exec(adminDistrict)
  return inverted ? inverted[1] : adminDistrict
}
