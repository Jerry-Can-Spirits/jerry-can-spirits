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

describe('migration 0044 recipe units backfill', () => {
  it('backfills recipe_unit and recipe_qty from pour_ml and unit_count', () => {
    const db = openDb()

    // Set up the PRE-0044 shape
    db.exec(`
      CREATE TABLE pouriq_ingredients_library (
        id        TEXT PRIMARY KEY,
        base_unit TEXT NOT NULL
      );
      INSERT INTO pouriq_ingredients_library (id, base_unit) VALUES
        ('lib-ml',   'ml'),
        ('lib-each', 'each');

      CREATE TABLE pouriq_ingredients (
        id                   TEXT PRIMARY KEY,
        cocktail_id          TEXT,
        library_ingredient_id TEXT,
        pour_ml              REAL,
        unit_count           REAL
      );
      INSERT INTO pouriq_ingredients (id, cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
        ('line-ml',   'c1', 'lib-ml',   50,    NULL),
        ('line-each', 'c1', 'lib-each', NULL,  0.125);
    `)

    const migrationSql = stripPragmas(loadMigration('0044_recipe_units.sql'))
    db.exec(migrationSql)

    // Assert backfilled values
    const rows = db
      .prepare(
        `SELECT id, recipe_unit, recipe_qty, pour_ml, unit_count
         FROM pouriq_ingredients ORDER BY id`,
      )
      .all() as Array<{
      id: string
      recipe_unit: string | null
      recipe_qty: number | null
      pour_ml: number | null
      unit_count: number | null
    }>

    expect(rows).toHaveLength(2)

    const mlLine = rows.find(r => r.id === 'line-ml')
    expect(mlLine).toBeDefined()
    expect(mlLine!.recipe_unit).toBe('ml')
    expect(mlLine!.recipe_qty).toBe(50)
    // base columns unchanged
    expect(mlLine!.pour_ml).toBe(50)
    expect(mlLine!.unit_count).toBeNull()

    const eachLine = rows.find(r => r.id === 'line-each')
    expect(eachLine).toBeDefined()
    expect(eachLine!.recipe_unit).toBe('item')
    expect(eachLine!.recipe_qty).toBe(0.125)
    // base columns unchanged
    expect(eachLine!.pour_ml).toBeNull()
    expect(eachLine!.unit_count).toBe(0.125)

    db.close()
  })

  it('creates the pouriq_ingredient_serve_units table', () => {
    const db = openDb()

    db.exec(`
      CREATE TABLE pouriq_ingredients_library (
        id        TEXT PRIMARY KEY,
        base_unit TEXT NOT NULL
      );
      CREATE TABLE pouriq_ingredients (
        id                    TEXT PRIMARY KEY,
        cocktail_id           TEXT,
        library_ingredient_id TEXT,
        pour_ml               REAL,
        unit_count            REAL
      );
    `)

    const migrationSql = stripPragmas(loadMigration('0044_recipe_units.sql'))
    db.exec(migrationSql)

    const result = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='pouriq_ingredient_serve_units'`,
      )
      .get() as { name: string } | undefined

    expect(result).toBeDefined()
    expect(result!.name).toBe('pouriq_ingredient_serve_units')

    db.close()
  })
})
