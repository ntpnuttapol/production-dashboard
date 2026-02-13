-- ═══════════════════════════════════════
-- FINISHING ENTRIES TABLE (การประกอบ)
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS finishing_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  target_qty INTEGER NOT NULL DEFAULT 0,
  completed_qty INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'idle')),
  shift TEXT NOT NULL DEFAULT 'morning' CHECK (shift IN ('morning', 'night')),
  start_time TIME NOT NULL,
  end_time TIME,
  operator TEXT NOT NULL,
  remarks TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finishing_entries_created_at ON finishing_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finishing_entries_status ON finishing_entries(status);
CREATE INDEX IF NOT EXISTS idx_finishing_entries_shift ON finishing_entries(shift);

-- Enable RLS
ALTER TABLE finishing_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON finishing_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON finishing_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON finishing_entries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON finishing_entries FOR DELETE USING (true);

-- Auto-update trigger
CREATE TRIGGER update_finishing_entries_updated_at
  BEFORE UPDATE ON finishing_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
