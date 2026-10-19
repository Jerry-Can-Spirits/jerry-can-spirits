-- Combat Stress as the charity partner shown on /giving/
-- Apply with: npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0081_combat_stress.sql

INSERT OR IGNORE INTO charities (id, name, description, logo_url, website_url, sort_order)
VALUES (
  'combat-stress',
  'Combat Stress',
  'Combat Stress describes itself as "the UK''s leading charity for veterans'' mental health".',
  'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/0c17b77a-595d-4bfe-2a48-833d2fcb6800/public',
  'https://combatstress.org.uk/',
  1
);
