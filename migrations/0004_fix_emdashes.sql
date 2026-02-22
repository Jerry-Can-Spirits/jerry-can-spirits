-- Remove em dashes from founder's notes
UPDATE batches SET
  founder_notes = 'Our first batch. Two Royal Signals veterans who decided to trade comms for spirits. Every bottle carries 700ml of the same liquid we spent months getting right - no shortcuts, no compromises. This is where the expedition begins.'
WHERE id = 'batch-001';
