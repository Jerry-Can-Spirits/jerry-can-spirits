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
    total_bottles: counts?.total ?? batch.bottle_count ?? 0,
    available: counts?.available ?? 0,
    sold: counts?.sold ?? 0,
    days_aged: daysAged,
  };
}
