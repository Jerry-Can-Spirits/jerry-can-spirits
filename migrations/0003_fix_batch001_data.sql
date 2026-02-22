-- Fix Batch 001 data: correct tasting notes, remove cask/distillation (unaged rum), update bottle count
UPDATE batches SET
  tasting_notes = 'Nose: Warm Madagascan vanilla leads with a rich, creamy softness. Ceylon cinnamon and toasted bourbon oak add warmth and structure, lifted by bright orange peel. Clove and allspice sit in the background, adding depth and subtle spice complexity. Palate: Silky and naturally sweet on entry thanks to agave. Ginger heat and cassia bark develop into layered baking spices, while subtle citrus returns mid-palate to balance the richness with a gentle zesty edge. Finish: Long, warming, and elegantly dry. Oak tannins linger alongside vanilla, winter spice, and a final flicker of ginger. Clean, refined, and crafted for sipping.',
  founder_notes = 'Our first batch. Two Royal Signals veterans who decided to trade comms for spirits. Every bottle carries 700ml of the same liquid we spent months getting right — no shortcuts, no compromises. This is where the expedition begins.',
  distillation_date = NULL,
  cask_type = NULL,
  bottle_count = 840
WHERE id = 'batch-001';
