-- Update batch-001 ingredient provenance with origins and suppliers
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0011_batch_ingredients_provenance.sql

UPDATE batch_ingredients SET origin = 'Peru',            supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-ginger';
UPDATE batch_ingredients SET origin = 'Spain',           supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-orange-peel';
UPDATE batch_ingredients SET origin = 'Sri Lanka',       supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-cloves';
UPDATE batch_ingredients SET origin = 'Guatemala',       supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-allspice';
UPDATE batch_ingredients SET origin = 'Indonesia',       supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-cassia';
UPDATE batch_ingredients SET origin = 'Mexico',          supplier = 'Beko'                 WHERE id = 'batch-001-agave';
UPDATE batch_ingredients SET origin = 'Sussex, England', supplier = 'Beko'                 WHERE id = 'batch-001-glucose';
UPDATE batch_ingredients SET supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-vanilla';
UPDATE batch_ingredients SET supplier = 'Cotswold Ingredients' WHERE id = 'batch-001-cinnamon';
