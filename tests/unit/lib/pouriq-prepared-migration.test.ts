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

function stripPragmas(sql: string): string {
  return sql
    .split('\n')
    .filter(line => !line.trim().toUpperCase().startsWith('PRAGMA'))
    .join('\n')
}

type TableInfoRow = {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('migration 0045 prepared recipes', () => {
  it('adds is_prepared column to pouriq_ingredients_library', () => {
    const db = openDb()

    // Minimal pre-0045 shape — only the column the migration touches
    db.exec(`CREATE TABLE pouriq_ingredients_library (id TEXT PRIMARY KEY)`)

    const migrationSql = stripPragmas(loadMigration('0045_prepared_recipes.sql'))
    db.exec(migrationSql)

    const columns = db
      .prepare(`SELECT name FROM pragma_table_info('pouriq_ingredients_library')`)
      .all() as Array<{ name: string }>

    const columnNames = columns.map(c => c.name)
    expect(columnNames).toContain('is_prepared')

    db.close()
  })

  it('creates pouriq_prepared_components with all expected columns', () => {
    const db = openDb()

    db.exec(`CREATE TABLE pouriq_ingredients_library (id TEXT PRIMARY KEY)`)

    const migrationSql = stripPragmas(loadMigration('0045_prepared_recipes.sql'))
    db.exec(migrationSql)

    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='pouriq_prepared_components'`,
      )
      .get() as { name: string } | undefined

    expect(tableExists).toBeDefined()
    expect(tableExists!.name).toBe('pouriq_prepared_components')

    const columns = db
      .prepare(`SELECT name FROM pragma_table_info('pouriq_prepared_components')`)
      .all() as Array<{ name: string }>

    const columnNames = columns.map(c => c.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('prepared_ingredient_id')
    expect(columnNames).toContain('component_ingredient_id')
    expect(columnNames).toContain('amount_base')
    expect(columnNames).toContain('recipe_unit')
    expect(columnNames).toContain('recipe_qty')
    expect(columnNames).toContain('created_at')

    db.close()
  })
})
