-- Remove the batch-001 molasses ingredient entirely.
--
-- Production has moved from Spirit of Wales, whose molasses sourcing was never
-- substantiated. The "What Goes In" section carries only ingredients we can
-- prove, so the molasses row is dropped rather than kept with a neutralised
-- supplier. 0007 is left untouched (already applied); this supersedes it.
--
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0073_remove_batch_001_molasses.sql

DELETE FROM batch_ingredients WHERE id = 'batch-001-molasses';
