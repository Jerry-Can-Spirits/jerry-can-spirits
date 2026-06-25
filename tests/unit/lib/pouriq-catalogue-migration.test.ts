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
// The migration renames a column on pouriq_barcode_catalogue, so it must exist first.
function seedBarcode(db: InstanceType<typeof DatabaseSync>): void {
  db.exec(`CREATE TABLE pouriq_barcode_catalogue (
    barcode TEXT PRIMARY KEY, name TEXT, ingredient_type TEXT,
    bottle_size_ml INTEGER, contributor_count INTEGER NOT NULL DEFAULT 1,
    verified INTEGER NOT NULL DEFAULT 0, first_contributor_account_id TEXT,
    created_at TEXT, updated_at TEXT)`)
  db.exec(`INSERT INTO pouriq_barcode_catalogue (barcode, name, ingredient_type, bottle_size_ml)
           VALUES ('5000', 'Smirnoff Red', 'spirit', 700)`)
}
function apply(db: InstanceType<typeof DatabaseSync>): void {
  db.exec(stripPragmas(loadMigration('0047_catalogue_modernise_seed.sql')))
}

describe('migration 0047 catalogue modernise + seed', () => {
  it('rebuilds the ingredient catalogue on the new model', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('pouriq_ingredient_catalogue')`).all() as Array<{ name: string }>).map((c) => c.name)
    expect(cols).toContain('base_unit')
    expect(cols).toContain('default_pack_size')
    expect(cols).toContain('aliases')
    expect(cols).not.toContain('pricing_mode')
    expect(cols).not.toContain('default_bottle_size_ml')
    db.close()
  })

  it('enforces the base_unit and ingredient_type CHECKs', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    expect(() => db.exec(`INSERT INTO pouriq_ingredient_catalogue (name,normalised_name,ingredient_type,base_unit) VALUES ('x','x','spirit','litre')`)).toThrow()
    expect(() => db.exec(`INSERT INTO pouriq_ingredient_catalogue (name,normalised_name,ingredient_type,base_unit) VALUES ('y','y','widget','ml')`)).toThrow()
    db.close()
  })

  it('seeds comprehensive coverage with correct base units', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const count = (db.prepare(`SELECT count(*) c FROM pouriq_ingredient_catalogue`).get() as { c: number }).c
    expect(count).toBeGreaterThan(100)
    const sugar = db.prepare(`SELECT base_unit FROM pouriq_ingredient_catalogue WHERE normalised_name='caster sugar'`).get() as { base_unit: string }
    expect(sugar.base_unit).toBe('g')
    const lime = db.prepare(`SELECT base_unit, default_pack_size FROM pouriq_ingredient_catalogue WHERE normalised_name='lime'`).get() as { base_unit: string; default_pack_size: number | null }
    expect(lime.base_unit).toBe('each')
    expect(lime.default_pack_size).toBeNull()
    const vodka = db.prepare(`SELECT base_unit, default_pack_size FROM pouriq_ingredient_catalogue WHERE normalised_name='vodka'`).get() as { base_unit: string; default_pack_size: number }
    expect(vodka.base_unit).toBe('ml')
    expect(vodka.default_pack_size).toBe(700)
    db.close()
  })

  it('carries a brand alias for generic matching', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const peach = db.prepare(`SELECT aliases FROM pouriq_ingredient_catalogue WHERE normalised_name='peach schnapps'`).get() as { aliases: string }
    expect(JSON.parse(peach.aliases)).toContain('archers')
    db.close()
  })

  it('renames the barcode catalogue size column, preserving rows', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('pouriq_barcode_catalogue')`).all() as Array<{ name: string }>).map((c) => c.name)
    expect(cols).toContain('pack_size_ml')
    expect(cols).not.toContain('bottle_size_ml')
    const row = db.prepare(`SELECT pack_size_ml FROM pouriq_barcode_catalogue WHERE barcode='5000'`).get() as { pack_size_ml: number }
    expect(row.pack_size_ml).toBe(700)
    db.close()
  })
})
