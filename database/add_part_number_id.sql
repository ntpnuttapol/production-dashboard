-- ═══════════════════════════════════════
-- MIGRATION: Add part_number_id to entries
-- ═══════════════════════════════════════

-- Add part_number_id column to production_entries
ALTER TABLE production_entries
  ADD COLUMN IF NOT EXISTS part_number_id UUID REFERENCES part_numbers(id);

-- Add part_number_id column to finishing_entries
ALTER TABLE finishing_entries
  ADD COLUMN IF NOT EXISTS part_number_id UUID REFERENCES part_numbers(id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_production_entries_part_number_id ON production_entries(part_number_id);
CREATE INDEX IF NOT EXISTS idx_finishing_entries_part_number_id ON finishing_entries(part_number_id);
