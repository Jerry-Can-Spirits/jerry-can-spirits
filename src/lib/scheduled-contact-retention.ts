// Weekly cron: enforce the retention commitment for contact form data.
// The privacy policy commits to holding contact form submissions for two years,
// so contact_submissions must not grow forever — this deletes rows older than
// two years. A retention policy that isn't enforced is a policy being breached
// (see docs/SECURITY.md). Idempotent: re-running deletes nothing new.

interface ContactRetentionEnv {
  DB: D1Database
}

// Contact form data retention window, per the privacy policy.
const RETENTION = "-2 years"

export async function runContactRetentionPurge(env: ContactRetentionEnv): Promise<void> {
  try {
    const res = await env.DB.prepare(
      `DELETE FROM contact_submissions WHERE created_at < datetime('now', ?)`,
    )
      .bind(RETENTION)
      .run()
    const deleted = res.meta?.changes ?? 0
    if (deleted > 0) {
      console.log(`[retention] purged ${deleted} contact_submissions older than 2 years`)
    }
  } catch (err) {
    console.error("[retention] contact_submissions purge failed:", err)
  }
}
