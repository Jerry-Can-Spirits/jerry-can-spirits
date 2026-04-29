/**
 * D1 Database utilities for batch and bottle data.
 *
 * Usage in API routes:
 *   const db = getD1(context);
 *   const batch = await getBatch(db, 'batch-001');
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

// ── Types ───────────────────────────────────────────────────────────

export interface Batch {
  id: string;
  name: string;
  product: string;
  cask_type: string | null;
  distillation_date: string | null;
  bottling_date: string | null;
  bottle_count: number | null;
  abv: number | null;
  status: string;
  tasting_notes: string | null;
  founder_notes: string | null;
  created_at: string;
}

export type LabelType = 'standard' | 'premium' | 'founder';

export interface Bottle {
  id: string;
  batch_id: string;
  bottle_number: number;
  label_type: LabelType;
  gtin: string | null;
  status: string;
  sold_at: string | null;
  created_at: string;
}

export interface BottleWithBatch extends Bottle {
  batch: Batch;
}

// ── Database Access ─────────────────────────────────────────────────

/** Get the D1 database binding from the Cloudflare context. */
export async function getD1(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return env.DB;
}

// ── Batch Queries ───────────────────────────────────────────────────

export async function getBatch(db: D1Database, id: string): Promise<Batch | null> {
  return db
    .prepare('SELECT * FROM batches WHERE id = ?')
    .bind(id)
    .first<Batch>();
}

export async function getAllBatches(db: D1Database): Promise<Batch[]> {
  const result = await db
    .prepare('SELECT * FROM batches ORDER BY created_at DESC')
    .all<Batch>();
  return result.results;
}

// ── Bottle Queries ──────────────────────────────────────────────────

export async function getBottle(
  db: D1Database,
  batchId: string,
  bottleNumber: number,
): Promise<BottleWithBatch | null> {
  const bottle = await db
    .prepare('SELECT * FROM bottles WHERE batch_id = ? AND bottle_number = ?')
    .bind(batchId, bottleNumber)
    .first<Bottle>();

  if (!bottle) return null;

  const batch = await getBatch(db, bottle.batch_id);
  if (!batch) return null;

  return { ...bottle, batch };
}

export async function getBottleByLabel(
  db: D1Database,
  batchId: string,
  labelType: LabelType,
  bottleNumber: number,
): Promise<BottleWithBatch | null> {
  const bottle = await db
    .prepare('SELECT * FROM bottles WHERE batch_id = ? AND label_type = ? AND bottle_number = ?')
    .bind(batchId, labelType, bottleNumber)
    .first<Bottle>();

  if (!bottle) return null;

  const batch = await getBatch(db, bottle.batch_id);
  if (!batch) return null;

  return { ...bottle, batch };
}

export async function getBottleById(
  db: D1Database,
  id: string,
): Promise<BottleWithBatch | null> {
  const bottle = await db
    .prepare('SELECT * FROM bottles WHERE id = ?')
    .bind(id)
    .first<Bottle>();

  if (!bottle) return null;

  const batch = await getBatch(db, bottle.batch_id);
  if (!batch) return null;

  return { ...bottle, batch };
}

// ── Batch Stats ─────────────────────────────────────────────────────

export interface BatchStats {
  total_bottles: number;
  available: number;
  sold: number;
  days_aged: number;
}

export async function getBatchStats(db: D1Database, batchId: string): Promise<BatchStats | null> {
  const batch = await getBatch(db, batchId);
  if (!batch) return null;

  const counts = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold
      FROM bottles WHERE batch_id = ?`,
    )
    .bind(batchId)
    .first<{ total: number; available: number; sold: number }>();

  const daysAged = batch.distillation_date
    ? Math.floor(
        (Date.now() - new Date(batch.distillation_date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return {
    total_bottles: (counts?.total ?? 0) > 0 ? (counts?.total ?? 0) : (batch.bottle_count ?? 0),
    available: counts?.available ?? 0,
    sold: counts?.sold ?? 0,
    days_aged: daysAged,
  };
}

// ── Ingredient Queries ───────────────────────────────────────────────

export interface BatchIngredient {
  id: string;
  batch_id: string;
  name: string;
  origin: string | null;
  supplier: string | null;
  notes: string | null;
  sort_order: number;
}

export async function getBatchIngredients(
  db: D1Database,
  batchId: string,
): Promise<BatchIngredient[]> {
  const result = await db
    .prepare(
      'SELECT id, batch_id, name, origin, supplier, notes, sort_order FROM batch_ingredients WHERE batch_id = ? ORDER BY sort_order ASC',
    )
    .bind(batchId)
    .all<BatchIngredient>();
  return result.results;
}

// ── Charity Queries ──────────────────────────────────────────────────

export interface Charity {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
}

export interface CharityContribution {
  id: string;
  charity_id: string;
  amount_gbp: number | null;
  year: number;
  period_description: string;
  notes: string | null;
}

export async function getCharities(db: D1Database): Promise<Charity[]> {
  const result = await db
    .prepare(
      'SELECT id, name, description, logo_url, website_url, sort_order FROM charities ORDER BY sort_order ASC',
    )
    .all<Charity>();
  return result.results;
}

export async function getCharityContributions(
  db: D1Database,
): Promise<CharityContribution[]> {
  const result = await db
    .prepare(
      'SELECT id, charity_id, amount_gbp, year, period_description, notes FROM charity_contributions ORDER BY year DESC, created_at DESC',
    )
    .all<CharityContribution>();
  return result.results;
}

// ── Expedition Log Queries ────────────────────────────────────────────

export interface ExpeditionLogEntry {
  id: string;
  batch_id: string;
  name: string;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  bottle_type: string | null;
  bottle_number: number | null;
  created_at: string;
}

export async function getExpeditionLogEntries(db: D1Database): Promise<ExpeditionLogEntry[]> {
  const result = await db
    .prepare(
      `SELECT id, batch_id, name, location, location_lat, location_lng, bottle_type, bottle_number, created_at
       FROM expedition_log
       WHERE removed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 500`,
    )
    .all<ExpeditionLogEntry>();
  return result.results;
}

export async function isBottleLogged(
  db: D1Database,
  batchId: string,
  bottleType: string,
  bottleNumber: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      'SELECT id FROM expedition_log WHERE batch_id = ? AND bottle_type = ? AND bottle_number = ? AND removed_at IS NULL LIMIT 1',
    )
    .bind(batchId, bottleType, bottleNumber)
    .first();
  return result !== null;
}

// ── Trade Account Queries ─────────────────────────────────────────────

export interface TradeAccount {
  id: string;
  pin: string;
  discount_code: string;
  tier: 'intro' | 'standard' | 'partner';
  venue_name: string;
  active: number;
}

export async function getTradeAccountByPin(
  db: D1Database,
  pin: string,
): Promise<TradeAccount | null> {
  return db
    .prepare('SELECT * FROM trade_accounts WHERE pin = ? AND active = 1')
    .bind(pin)
    .first<TradeAccount>();
}
