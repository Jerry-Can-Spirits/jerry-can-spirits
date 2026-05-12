-- Pour IQ Demo Venue seed.
--
-- Creates the demo trade account, a non-expiring Pour IQ pilot licence,
-- a curated library of ~30 ingredients, and a 14-drink menu designed to
-- surface every Pour IQ analysis output (target GP, below-target,
-- waste risk, ingredient overlap, brand drink).
--
-- Apply remote: wrangler d1 execute jerry-can-spirits-db --remote --file=scripts/seed-pouriq-demo.sql
--
-- Idempotency: not rerun-safe. Drop the demo account first if reseeding:
--   DELETE FROM trade_accounts WHERE pin = '58471209';
--   (CASCADE removes pouriq_menus, pouriq_cocktails, pouriq_ingredients,
--    pouriq_ingredients_library, pouriq_subscriptions tied to it.)

-- ── 1. Demo trade account ───────────────────────────────────────────────
INSERT INTO trade_accounts (pin, discount_code, tier, venue_name)
VALUES ('58471209', 'TRADE-PARTNER-3', 'partner', 'Pour IQ Demo Venue');

-- ── 2. Non-expiring Pour IQ pilot licence ───────────────────────────────
INSERT INTO pouriq_subscriptions (trade_account_id, licence_type, valid_until, price_paid_p, notes)
VALUES (
  (SELECT id FROM trade_accounts WHERE pin = '58471209'),
  'pilot',
  datetime('now', '+10 years'),
  0,
  'Demo account - non-expiring'
);

-- ── 3. Library entries (29 ingredients) ─────────────────────────────────
-- Spirits
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Vodka', 'spirit', 700, 2200, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'House Gin', 'spirit', 700, 1900, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Premium Gin', 'spirit', 700, 2400, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'White Rum', 'spirit', 700, 1800, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Bourbon', 'spirit', 700, 3000, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Tequila', 'spirit', 700, 2700, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Whisky', 'spirit', 700, 2000, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Expedition Spiced Rum', 'spirit', 700, 2400, NULL);

-- Liqueurs
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Campari', 'liqueur', 700, 1800, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Sweet Vermouth', 'liqueur', 1000, 1300, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Aperol', 'liqueur', 700, 1700, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Coffee Liqueur', 'liqueur', 700, 2000, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Triple Sec', 'liqueur', 700, 3000, NULL);

-- Wine
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Prosecco', 'wine', 750, 800, NULL);

-- Mixers
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Cream of Coconut', 'mixer', 425, 400, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Tonic Water', 'mixer', 500, 250, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Cola', 'mixer', 330, 80, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Ginger Beer', 'mixer', 330, 120, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Soda Water', 'mixer', 1000, 150, NULL);

-- Syrup
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Simple Syrup', 'syrup', 500, 200, NULL);

-- Juices
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Lime Juice', 'juice', 1000, 600, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Lemon Juice', 'juice', 1000, 550, NULL),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Cranberry Juice', 'juice', 1000, 300, NULL);

-- Other
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Angostura Bitters', 'other', 100, 800, NULL);

-- Unit-priced (espresso, garnishes)
INSERT INTO pouriq_ingredients_library (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p) VALUES
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Espresso Shot', 'other', NULL, NULL, 50),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Lime', 'garnish', NULL, NULL, 60),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Lemon', 'garnish', NULL, NULL, 40),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Mint Sprig', 'garnish', NULL, NULL, 15),
  ((SELECT id FROM trade_accounts WHERE pin = '58471209'), 'Orange', 'garnish', NULL, NULL, 70);

-- ── 4. Demo menu ────────────────────────────────────────────────────────
INSERT INTO pouriq_menus (trade_account_id, name, venue_type, city, target_gp_pct, positioning, notes)
VALUES (
  (SELECT id FROM trade_accounts WHERE pin = '58471209'),
  'Spring 2026',
  'cocktail-bar',
  'London',
  75.0,
  'premium',
  'Showcase menu. Curated to demonstrate Pour IQ analysis outputs.'
);

-- ── 5. Drinks + ingredients (14 drinks) ─────────────────────────────────
-- Helper: every cocktail inserts then references via a name+menu lookup.
-- Every ingredient row references library by name and cocktail by name.

-- 5.1 Mojito (rum, Field Manual match)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Mojito', 1000, 1);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Mojito'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'White Rum'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Mojito'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime'), NULL, 0.5),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Mojito'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Mint Sprig'), NULL, 1),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Mojito'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Simple Syrup'), 15, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Mojito'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Soda Water'), 100, NULL);

-- 5.2 Daiquiri (rum, Field Manual)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Daiquiri', 1000, 2);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Daiquiri'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'White Rum'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Daiquiri'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime Juice'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Daiquiri'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Simple Syrup'), 15, NULL);

-- 5.3 Old Fashioned (bourbon)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Old Fashioned', 1200, 3);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Old Fashioned'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Bourbon'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Old Fashioned'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Simple Syrup'), 5, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Old Fashioned'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Angostura Bitters'), 2, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Old Fashioned'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Orange'), NULL, 0.125);

-- 5.4 Negroni (gin)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Negroni', 1000, 4);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Negroni'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Premium Gin'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Negroni'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Campari'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Negroni'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Sweet Vermouth'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Negroni'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Orange'), NULL, 0.125);

-- 5.5 Margarita (tequila) — priced low to trigger below-target flag
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Margarita', 1000, 5);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Margarita'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Tequila'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Margarita'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Triple Sec'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Margarita'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime Juice'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Margarita'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime'), NULL, 0.125);

-- 5.6 Espresso Martini (vodka) — priced LOW to trigger pricing flag
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Espresso Martini', 800, 6);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Espresso Martini'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Vodka'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Espresso Martini'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Coffee Liqueur'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Espresso Martini'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Espresso Shot'), NULL, 1),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Espresso Martini'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Simple Syrup'), 10, NULL);

-- 5.7 Cosmopolitan (vodka)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Cosmopolitan', 1000, 7);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Cosmopolitan'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Vodka'), 40, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Cosmopolitan'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Triple Sec'), 15, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Cosmopolitan'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Cranberry Juice'), 30, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Cosmopolitan'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime Juice'), 15, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Cosmopolitan'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime'), NULL, 0.125);

-- 5.8 Whiskey Sour (whisky, Field Manual)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Whiskey Sour', 1000, 8);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Whiskey Sour'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Whisky'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Whiskey Sour'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lemon Juice'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Whiskey Sour'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Simple Syrup'), 15, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Whiskey Sour'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lemon'), NULL, 0.125);

-- 5.9 Aperol Spritz
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Aperol Spritz', 1000, 9);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Aperol Spritz'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Aperol'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Aperol Spritz'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Prosecco'), 75, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Aperol Spritz'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Soda Water'), 25, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Aperol Spritz'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Orange'), NULL, 0.125);

-- 5.10 Pina Colada (rum, Field Manual) — single-use Cream of Coconut for waste flag
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Pina Colada', 1000, 10);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Pina Colada'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'White Rum'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Pina Colada'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Cream of Coconut'), 30, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Pina Colada'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime Juice'), 15, NULL);

-- 5.11 Storm and Spice (Jerry Can Expedition Spiced + ginger beer — Field Manual)
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'Storm and Spice', 1000, 11);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Storm and Spice'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Expedition Spiced Rum'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Storm and Spice'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Ginger Beer'), 150, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Storm and Spice'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime'), NULL, 0.25),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'Storm and Spice'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Mint Sprig'), NULL, 1);

-- 5.12 House Gin & Tonic
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'House Gin & Tonic', 850, 12);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Gin & Tonic'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'House Gin'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Gin & Tonic'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Tonic Water'), 200, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Gin & Tonic'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime'), NULL, 0.125);

-- 5.13 House Vodka & Cola
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'House Vodka & Cola', 800, 13);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Vodka & Cola'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Vodka'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Vodka & Cola'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Cola'), 200, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Vodka & Cola'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lemon'), NULL, 0.125);

-- 5.14 House Rum & Ginger Beer
INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position) VALUES
  ((SELECT id FROM pouriq_menus WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Spring 2026'), 'House Rum & Ginger Beer', 800, 14);
INSERT INTO pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count) VALUES
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Rum & Ginger Beer'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'White Rum'), 50, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Rum & Ginger Beer'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Ginger Beer'), 200, NULL),
  ((SELECT c.id FROM pouriq_cocktails c JOIN pouriq_menus m ON m.id = c.menu_id WHERE m.trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND c.name = 'House Rum & Ginger Beer'),
   (SELECT id FROM pouriq_ingredients_library WHERE trade_account_id = (SELECT id FROM trade_accounts WHERE pin = '58471209') AND name = 'Lime'), NULL, 0.125);
