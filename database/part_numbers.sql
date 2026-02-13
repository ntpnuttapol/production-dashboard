-- ═══════════════════════════════════════
-- PART NUMBERS (Master Table)
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS part_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  part_name TEXT NOT NULL,
  std_qty INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_part_numbers_part_number ON part_numbers(part_number);
CREATE INDEX IF NOT EXISTS idx_part_numbers_is_active ON part_numbers(is_active);

-- Enable RLS
ALTER TABLE part_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON part_numbers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON part_numbers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON part_numbers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON part_numbers FOR DELETE USING (true);

-- Auto-update trigger
CREATE TRIGGER update_part_numbers_updated_at
  BEFORE UPDATE ON part_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════
-- ALTER PLANNING_ENTRIES - Add part_number_id
-- ═══════════════════════════════════════

ALTER TABLE planning_entries 
ADD COLUMN IF NOT EXISTS part_number_id UUID REFERENCES part_numbers(id);

-- ═══════════════════════════════════════
-- ALTER PRODUCTION_ENTRIES - Add plan_id
-- ═══════════════════════════════════════

ALTER TABLE production_entries 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES planning_entries(id);

-- ═══════════════════════════════════════
-- ALTER FINISHING_ENTRIES - Add plan_id
-- ═══════════════════════════════════════

ALTER TABLE finishing_entries 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES planning_entries(id);
