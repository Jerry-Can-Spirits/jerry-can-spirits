-- Two Pour IQ tables that 0082 missed (both recreated by later migrations
-- under the same names, which the inventory did not catch). No site code
-- reads them.
PRAGMA defer_foreign_keys = true;

DROP TABLE IF EXISTS pouriq_invoices;
DROP TABLE IF EXISTS pouriq_voice_profiles;
