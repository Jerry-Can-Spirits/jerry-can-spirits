import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openDb(): InstanceType<typeof DatabaseSync> {
  return new DatabaseSync(':memory:')
}

function loadMigration(filename: string): string {
  const filePath = path.resolve(__dirname, '../../../migrations', filename)
  return readFileSync(filePath, 'utf-8')
}

/**
 * Strip PRAGMA lines so they don't confuse the in-memory exec
 * (they're harmless but node:sqlite doesn't need them).
 */
function stripPragmas(sql: string): string {
  return sql
    .split('\n')
    .filter(line => !line.trim().toUpperCase().startsWith('PRAGMA'))
    .join('\n')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('migration 0043 backfill mapping', () => {
  it('maps bottle row to base_unit=ml, pack_size=700, price_p=2000', () => {
    const db = openDb()

    // Create the OLD table shape (permissive — no CHECK on the legacy columns)
    db.exec(`
      CREATE TABLE trade_accounts (
        id TEXT PRIMARY KEY
      );
      INSERT INTO trade_accounts (id) VALUES ('acct-1');

      CREATE TABLE pouriq_ingredients_library (
        id               TEXT PRIMARY KEY,
        trade_account_id TEXT NOT NULL,
        name             TEXT NOT NULL,
        ingredient_type  TEXT NOT NULL,
        bottle_size_ml   REAL,
        bottle_cost_p    INTEGER,
        unit_cost_p      INTEGER,
        purchase_qty     INTEGER NOT NULL DEFAULT 1,
        yield_pct        REAL    NOT NULL DEFAULT 100,
        barcode          TEXT,
        notes            TEXT,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)

    // Insert a bottle row: bottle_size_ml=700, bottle_cost_p=2000
    db.exec(`
      INSERT INTO pouriq_ingredients_library
        (id, trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p, purchase_qty, yield_pct)
      VALUES
        ('id-bottle', 'acct-1', 'Dark Rum', 'spirit', 700, 2000, NULL, 1, 100);
    `)

    // Insert a unit row: bottle_size_ml=NULL, unit_cost_p=800, purchase_qty=40
    db.exec(`
      INSERT INTO pouriq_ingredients_library
        (id, trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p, purchase_qty, yield_pct)
      VALUES
        ('id-unit', 'acct-1', 'Lime', 'garnish', NULL, NULL, 800, 40, 100);
    `)

    // Run the migration (strip PRAGMAs; the new table, INSERT, DROP, RENAME, indexes)
    const migrationSql = stripPragmas(
      loadMigration('0043_ingredient_purchase_model.sql'),
    )
    db.exec(migrationSql)

    // Read back all rows
    const rows = db
      .prepare(
        `SELECT id, base_unit, pack_size, price_p, purchase_qty FROM pouriq_ingredients_library ORDER BY id`,
      )
      .all() as Array<{
      id: string
      base_unit: string
      pack_size: number
      price_p: number
      purchase_qty: number
    }>

    expect(rows).toHaveLength(2)

    const bottle = rows.find(r => r.id === 'id-bottle')
    expect(bottle).toBeDefined()
    expect(bottle!.base_unit).toBe('ml')
    expect(bottle!.pack_size).toBe(700)
    expect(bottle!.price_p).toBe(2000)
    expect(bottle!.purchase_qty).toBe(1)

    const unit = rows.find(r => r.id === 'id-unit')
    expect(unit).toBeDefined()
    expect(unit!.base_unit).toBe('each')
    expect(unit!.pack_size).toBe(1)
    expect(unit!.price_p).toBe(800)
    expect(unit!.purchase_qty).toBe(40)

    db.close()
  })

  it('preserves original ids so inbound FK references stay valid', () => {
    const db = openDb()

    db.exec(`
      CREATE TABLE trade_accounts (id TEXT PRIMARY KEY);
      INSERT INTO trade_accounts (id) VALUES ('acct-2');

      CREATE TABLE pouriq_ingredients_library (
        id               TEXT PRIMARY KEY,
        trade_account_id TEXT NOT NULL,
        name             TEXT NOT NULL,
        ingredient_type  TEXT NOT NULL,
        bottle_size_ml   REAL,
        bottle_cost_p    INTEGER,
        unit_cost_p      INTEGER,
        purchase_qty     INTEGER NOT NULL DEFAULT 1,
        yield_pct        REAL    NOT NULL DEFAULT 100,
        barcode          TEXT,
        notes            TEXT,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO pouriq_ingredients_library
        (id, trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p, purchase_qty, yield_pct)
      VALUES
        ('fixed-id-abc', 'acct-2', 'Vodka', 'spirit', 700, 1800, NULL, 1, 100),
        ('fixed-id-def', 'acct-2', 'Sugar', 'other',  NULL, NULL, 50, 1000, 100);
    `)

    const migrationSql = stripPragmas(
      loadMigration('0043_ingredient_purchase_model.sql'),
    )
    db.exec(migrationSql)

    const ids = (
      db
        .prepare(`SELECT id FROM pouriq_ingredients_library ORDER BY id`)
        .all() as Array<{ id: string }>
    ).map(r => r.id)

    expect(ids).toContain('fixed-id-abc')
    expect(ids).toContain('fixed-id-def')
    expect(ids).toHaveLength(2)

    db.close()
  })
})
