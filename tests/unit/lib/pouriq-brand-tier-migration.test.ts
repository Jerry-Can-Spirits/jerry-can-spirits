import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

function openDb(): InstanceType<typeof DatabaseSync> {
  return new DatabaseSync(':memory:')
}
function loadMigration(filename: string): string {
  return readFileSync(path.resolve(__dirname, '../../../migrations', filename), 'utf-8')
}
function stripPragmas(sql: string): string {
  return sql.split('\n').filter((l) => !l.trim().toUpperCase().startsWith('PRAGMA')).join('\n')
}
// 0047 renames a column on pouriq_barcode_catalogue, so it must exist first.
function seedBarcode(db: InstanceType<typeof DatabaseSync>): void {
  db.exec(`CREATE TABLE pouriq_barcode_catalogue (
    barcode TEXT PRIMARY KEY, name TEXT, ingredient_type TEXT,
    bottle_size_ml INTEGER, contributor_count INTEGER NOT NULL DEFAULT 1,
    verified INTEGER NOT NULL DEFAULT 0, first_contributor_account_id TEXT,
    created_at TEXT, updated_at TEXT)`)
}
function applyAll(db: InstanceType<typeof DatabaseSync>): void {
  seedBarcode(db)
  db.exec(stripPragmas(loadMigration('0047_catalogue_modernise_seed.sql')))
  db.exec(stripPragmas(loadMigration('0048_catalogue_brand_tier.sql')))
}

describe('migration 0048 catalogue brand tier', () => {
  it('adds the generic column', () => {
    const db = openDb(); applyAll(db)
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('pouriq_ingredient_catalogue')`).all() as Array<{ name: string }>).map((c) => c.name)
    expect(cols).toContain('generic')
    db.close()
  })

  it('seeds brand rows linked to existing generics', () => {
    const db = openDb(); applyAll(db)
    const total = (db.prepare(`SELECT count(*) c FROM pouriq_ingredient_catalogue`).get() as { c: number }).c
    expect(total).toBeGreaterThan(180)
    const carling = db.prepare(`SELECT ingredient_type, base_unit, generic FROM pouriq_ingredient_catalogue WHERE normalised_name='carling'`).get() as { ingredient_type: string; base_unit: string; generic: string }
    expect(carling).toEqual({ ingredient_type: 'beer', base_unit: 'ml', generic: 'lager' })
    const smirnoff = db.prepare(`SELECT generic FROM pouriq_ingredient_catalogue WHERE normalised_name='smirnoff'`).get() as { generic: string }
    expect(smirnoff.generic).toBe('vodka')
  })

  it('never points a brand at a missing generic', () => {
    const db = openDb(); applyAll(db)
    const orphans = db.prepare(`
      SELECT b.normalised_name FROM pouriq_ingredient_catalogue b
      WHERE b.generic IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM pouriq_ingredient_catalogue g WHERE g.normalised_name = b.generic)
    `).all() as Array<{ normalised_name: string }>
    expect(orphans).toEqual([])
    db.close()
  })

  it('generic rows keep a NULL generic', () => {
    const db = openDb(); applyAll(db)
    const lager = db.prepare(`SELECT generic FROM pouriq_ingredient_catalogue WHERE normalised_name='lager'`).get() as { generic: string | null }
    expect(lager.generic).toBeNull()
    db.close()
  })
})
