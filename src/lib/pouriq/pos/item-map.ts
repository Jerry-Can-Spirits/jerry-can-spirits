// POS item → cocktail mapping: alias loading (used by ingest), plus the
// review / mapping / ignore data access used by the API routes.

export interface PosItemAlias {
  normalised_pos_name: string
  cocktail_id: string | null
  cocktail_name: string | null
  ignored: number
}

export async function loadAliases(
  db: D1Database,
  tradeAccountId: string,
): Promise<Map<string, PosItemAlias>> {
  const res = await db
    .prepare(`SELECT normalised_pos_name, cocktail_id, cocktail_name, ignored FROM pouriq_pos_item_map WHERE trade_account_id = ?1`)
    .bind(tradeAccountId)
    .all<PosItemAlias>()
  return new Map((res.results ?? []).map((a) => [a.normalised_pos_name, a]))
}
