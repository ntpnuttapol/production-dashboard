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

-- Planning has been removed from the app flow.
-- Keep this script focused on part number master data only.
