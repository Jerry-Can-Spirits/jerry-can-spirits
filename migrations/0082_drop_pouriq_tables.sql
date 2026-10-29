-- Pour IQ moved to its own repository, Worker and database. These 27 tables
-- are what the pilot left behind in the Jerry Can Spirits database; no site
-- code reads them any more (the trade landing page no longer checks for a
-- Pour IQ licence). Dropped child-first; foreign-key checks are deferred so
-- the order of any remaining references does not matter.
PRAGMA defer_foreign_keys = true;

DROP TABLE IF EXISTS pouriq_pos_seen_orders;
DROP TABLE IF EXISTS pouriq_pos_unmatched_lines;
DROP TABLE IF EXISTS pouriq_pos_item_map;
DROP TABLE IF EXISTS pouriq_pos_oauth_states;
DROP TABLE IF EXISTS pouriq_pos_connections;
DROP TABLE IF EXISTS pouriq_accounting_pushes;
DROP TABLE IF EXISTS pouriq_accounting_connections;
DROP TABLE IF EXISTS pouriq_invoice_lines;
DROP TABLE IF EXISTS pouriq_analyses;
DROP TABLE IF EXISTS pouriq_cost_changes;
DROP TABLE IF EXISTS pouriq_drink_volumes;
DROP TABLE IF EXISTS pouriq_ingredient_uses;
DROP TABLE IF EXISTS pouriq_ingredient_serve_units;
DROP TABLE IF EXISTS pouriq_prepared_components;
DROP TABLE IF EXISTS pouriq_production_components;
DROP TABLE IF EXISTS pouriq_production_events;
DROP TABLE IF EXISTS pouriq_stock_count_events;
DROP TABLE IF EXISTS pouriq_stock_counts;
DROP TABLE IF EXISTS pouriq_stock_receipts;
DROP TABLE IF EXISTS pouriq_barcode_catalogue;
DROP TABLE IF EXISTS pouriq_ingredient_catalogue;
DROP TABLE IF EXISTS pouriq_ingredients;
DROP TABLE IF EXISTS pouriq_ingredients_library;
DROP TABLE IF EXISTS pouriq_menu_sections;
DROP TABLE IF EXISTS pouriq_cocktails;
DROP TABLE IF EXISTS pouriq_menus;
DROP TABLE IF EXISTS pouriq_subscriptions;
