import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

function stripPragmas(sql: string): string {
  return sql.split('\n').filter((l) => !l.trim().toUpperCase().startsWith('PRAGMA')).join('\n')
}

describe('migration 0049 ingredient par', () => {
  it('adds the par_bottles column', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(`CREATE TABLE pouriq_ingredients_library (id TEXT PRIMARY KEY)`)
    const sql = readFileSync(path.resolve(__dirname, '../../../migrations/0049_ingredient_par.sql'), 'utf-8')
    db.exec(stripPragmas(sql))
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('pouriq_ingredients_library')`).all() as Array<{ name: string }>).map((c) => c.name)
    expect(cols).toContain('par_bottles')
    db.close()
  })
})
