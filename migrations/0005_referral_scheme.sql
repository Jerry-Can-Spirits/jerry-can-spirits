-- Referral Scheme — £5 off for both referrer and referee
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0005_referral_scheme.sql

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_email TEXT NOT NULL,
  referrer_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_rewards_earned INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referrer_code);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referral_id INTEGER NOT NULL REFERENCES referrals(id),
  referee_email TEXT,
  order_id TEXT,
  reward_discount_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_conversions_referral ON referral_conversions(referral_id);
CREATE INDEX IF NOT EXISTS idx_conversions_order ON referral_conversions(order_id);
