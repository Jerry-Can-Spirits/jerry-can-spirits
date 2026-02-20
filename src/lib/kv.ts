/**
 * Typed KV utilities for the SITE_OPS namespace.
 *
 * Key patterns:
 *   feature:{name}   — Feature flags (JSON, no expiry)
 *   ageverified:{fp}  — Server-side age verification cache (365d TTL)
 *   visitor:{fp}      — First-time vs returning visitor (30d TTL)
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
