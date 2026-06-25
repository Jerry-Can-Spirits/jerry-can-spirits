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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('migration 0046 production events', () => {
  it('creates pouriq_production_events with all expected columns', () => {
    const db = openDb()

    db.exec(`CREATE TABLE pouriq_ingredients_library (id TEXT PRIMARY KEY)`)

    const migrationSql = stripPragmas(loadMigration('0046_production_events.sql'))
    db.exec(migrationSql)

    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='pouriq_production_events'`,
      )
      .get() as { name: string } | undefined

    expect(tableExists).toBeDefined()
    expect(tableExists!.name).toBe('pouriq_production_events')

    const columns = db
      .prepare(`SELECT name FROM pragma_table_info('pouriq_production_events')`)
      .all() as Array<{ name: string }>

    const columnNames = columns.map(c => c.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('trade_account_id')
    expect(columnNames).toContain('prepared_ingredient_id')
    expect(columnNames).toContain('batches')
    expect(columnNames).toContain('yield_base_produced')
    expect(columnNames).toContain('produced_at')
    expect(columnNames).toContain('created_at')

    db.close()
  })

  it('creates pouriq_production_components with all expected columns', () => {
    const db = openDb()

    db.exec(`CREATE TABLE pouriq_ingredients_library (id TEXT PRIMARY KEY)`)

    const migrationSql = stripPragmas(loadMigration('0046_production_events.sql'))
    db.exec(migrationSql)

    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='pouriq_production_components'`,
      )
      .get() as { name: string } | undefined

    expect(tableExists).toBeDefined()
    expect(tableExists!.name).toBe('pouriq_production_components')

    const columns = db
      .prepare(`SELECT name FROM pragma_table_info('pouriq_production_components')`)
      .all() as Array<{ name: string }>

    const columnNames = columns.map(c => c.name)

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('production_event_id')
    expect(columnNames).toContain('component_ingredient_id')
    expect(columnNames).toContain('amount_base_consumed')
    expect(columnNames).toContain('produced_at')

    db.close()
  })
})
