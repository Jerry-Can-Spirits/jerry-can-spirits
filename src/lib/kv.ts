/**
 * Typed KV utilities for the SITE_OPS namespace.
 *
 * Key patterns:
 *   feature:{name}          — Feature flags (JSON, no expiry)
 *   ageverified:{fp}        — Server-side age verification cache (365d TTL)
 *   visitor:{fp}            — First-time vs returning visitor (30d TTL)
 *   trade:failed:{ip}       — Trade PIN failed attempts (15min TTL)
 *   ratelimit:{prefix}:{ip} — Generic rate limit counters (configurable TTL)
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

// ── Types ───────────────────────────────────────────────────────────

export interface FeatureFlag {
  enabled: boolean;
  /** Optional metadata (e.g. variant, rollout percentage) */
  [key: string]: unknown;
}

export interface VisitorRecord {
  firstSeen: string;
  visitCount: number;
  lastVisit: string;
}

// ── KV Access ───────────────────────────────────────────────────────

export async function getSiteOpsKV(): Promise<KVNamespace> {
  const { env } = await getCloudflareContext();
  return env.SITE_OPS;
}

// ── Feature Flags ───────────────────────────────────────────────────

export async function getFeatureFlag(
  kv: KVNamespace,
  name: string,
): Promise<FeatureFlag | null> {
  return kv.get<FeatureFlag>(`feature:${name}`, 'json');
}

export async function isFeatureEnabled(
  kv: KVNamespace,
  name: string,
): Promise<boolean> {
  const flag = await getFeatureFlag(kv, name);
  return flag?.enabled ?? false;
}

export async function setFeatureFlag(
  kv: KVNamespace,
  name: string,
  flag: FeatureFlag,
): Promise<void> {
  await kv.put(`feature:${name}`, JSON.stringify(flag));
}

// ── Age Verification Cache ──────────────────────────────────────────

const AGE_VERIFIED_TTL = 60 * 60 * 24 * 365; // 365 days

export async function isAgeVerified(
  kv: KVNamespace,
  fingerprint: string,
): Promise<boolean> {
  const val = await kv.get(`ageverified:${fingerprint}`);
  return val === 'true';
}

export async function setAgeVerified(
  kv: KVNamespace,
  fingerprint: string,
): Promise<void> {
  await kv.put(`ageverified:${fingerprint}`, 'true', {
    expirationTtl: AGE_VERIFIED_TTL,
  });
}

// ── Visitor Tracking ────────────────────────────────────────────────

const VISITOR_TTL = 60 * 60 * 24 * 30; // 30 days

export async function getVisitor(
  kv: KVNamespace,
  fingerprint: string,
): Promise<VisitorRecord | null> {
  return kv.get<VisitorRecord>(`visitor:${fingerprint}`, 'json');
}

export async function trackVisitor(
  kv: KVNamespace,
  fingerprint: string,
): Promise<VisitorRecord> {
  const existing = await getVisitor(kv, fingerprint);
  const now = new Date().toISOString();

  const record: VisitorRecord = existing
    ? { ...existing, visitCount: existing.visitCount + 1, lastVisit: now }
    : { firstSeen: now, visitCount: 1, lastVisit: now };

  await kv.put(`visitor:${fingerprint}`, JSON.stringify(record), {
    expirationTtl: VISITOR_TTL,
  });

  return record;
}

// ── Trade PIN Rate Limiting ─────────────────────────────────────────

export const TRADE_MAX_ATTEMPTS = 5;
const TRADE_LOCKOUT_TTL = 15 * 60; // 15 minutes

export async function getTradeFailedAttempts(
  kv: KVNamespace,
  ip: string,
): Promise<number> {
  const val = await kv.get(`trade:failed:${ip}`);
  return val ? parseInt(val, 10) : 0;
}

export async function incrementTradeFailedAttempts(
  kv: KVNamespace,
  ip: string,
): Promise<number> {
  const current = await getTradeFailedAttempts(kv, ip);
  const next = current + 1;
  await kv.put(`trade:failed:${ip}`, String(next), {
    expirationTtl: TRADE_LOCKOUT_TTL,
  });
  return next;
}

export async function clearTradeFailedAttempts(
  kv: KVNamespace,
  ip: string,
): Promise<void> {
  await kv.delete(`trade:failed:${ip}`);
}

// ── Generic Rate Limiting ────────────────────────────────────────────

/**
 * Checks whether an IP has exceeded the rate limit for a given prefix,
 * and increments the counter if not. Returns true if the request should
 * be rejected. Uses a fixed window (counter resets after windowSeconds).
 */
export async function isRateLimited(
  kv: KVNamespace,
  prefix: string,
  ip: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `ratelimit:${prefix}:${ip}`;
  const val = await kv.get(key);
  const count = val ? parseInt(val, 10) : 0;
  if (count >= maxRequests) return true;
  await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return false;
}
