// D1 query helpers for the trade_applications register.

export interface TradeApplicationInsert {
  trading_name: string
  legal_entity_name: string
  legal_structure: string
  business_type: string
  companies_house_number: string | null
  vat_number: string | null
  awrs_urn: string | null
  years_trading: number
  website: string | null
  trading_address_json: string
  registered_address_json: string | null
  premises_licence_number: string | null
  licensing_authority: string | null
  dps_name: string | null
  personal_licence_number: string | null
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  director_name: string
  psc_json: string | null
  expected_initial_volume: string
  expected_monthly_volume: string
  payment_terms_pref: string
  how_heard: string | null
  notes: string | null
  marketing_opt_in: 0 | 1
  submitted_at: string
  next_review_date: string
  ip_address: string | null
  user_agent: string | null
}

export interface DueForReviewRow {
  id: string
  trading_name: string
  contact_email: string
  next_review_date: string
}

const INSERT_SQL = `
  INSERT INTO trade_applications (
    trading_name, legal_entity_name, legal_structure, business_type,
    companies_house_number, vat_number, awrs_urn, years_trading, website,
    trading_address_json, registered_address_json,
    premises_licence_number, licensing_authority, dps_name, personal_licence_number,
    contact_name, contact_role, contact_email, contact_phone, director_name, psc_json,
    expected_initial_volume, expected_monthly_volume, payment_terms_pref,
    how_heard, notes, marketing_opt_in,
    submitted_at, next_review_date, ip_address, user_agent
  ) VALUES (
    ?1, ?2, ?3, ?4,
    ?5, ?6, ?7, ?8, ?9,
    ?10, ?11,
    ?12, ?13, ?14, ?15,
    ?16, ?17, ?18, ?19, ?20, ?21,
    ?22, ?23, ?24,
    ?25, ?26, ?27,
    ?28, ?29, ?30, ?31
  ) RETURNING id
`

export async function insertTradeApplication(
  db: D1Database,
  data: TradeApplicationInsert,
): Promise<string> {
  const result = await db.prepare(INSERT_SQL).bind(
    data.trading_name, data.legal_entity_name, data.legal_structure, data.business_type,
    data.companies_house_number, data.vat_number, data.awrs_urn, data.years_trading, data.website,
    data.trading_address_json, data.registered_address_json,
    data.premises_licence_number, data.licensing_authority, data.dps_name, data.personal_licence_number,
    data.contact_name, data.contact_role, data.contact_email, data.contact_phone, data.director_name, data.psc_json,
    data.expected_initial_volume, data.expected_monthly_volume, data.payment_terms_pref,
    data.how_heard, data.notes, data.marketing_opt_in,
    data.submitted_at, data.next_review_date, data.ip_address, data.user_agent,
  ).first<{ id: string }>()
  if (!result) throw new Error('Insert returned no id')
  return result.id
}

export async function insertReviewLog(
  db: D1Database,
  args: {
    trade_application_id: string
    event_type: string
    reviewed_by: string
    next_review_date: string | null
    notes: string | null
    created_at: string
  },
): Promise<void> {
  await db.prepare(`
    INSERT INTO trade_application_review_log
      (trade_application_id, event_type, reviewed_by, next_review_date, notes, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(
    args.trade_application_id,
    args.event_type,
    args.reviewed_by,
    args.next_review_date,
    args.notes,
    args.created_at,
  ).run()
}

export async function getApplicationsDueForReview(
  db: D1Database,
  withinDays: number,
): Promise<DueForReviewRow[]> {
  const now = new Date().toISOString()
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString()
  const result = await db.prepare(`
    SELECT id, trading_name, contact_email, next_review_date
    FROM trade_applications
    WHERE status IN ('approved', 'active')
      AND next_review_date BETWEEN ?1 AND ?2
    ORDER BY next_review_date ASC
  `).bind(now, cutoff).all<DueForReviewRow>()
  return result.results ?? []
}
