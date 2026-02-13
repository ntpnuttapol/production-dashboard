-- ═══════════════════════════════════════
-- PLANNING ENTRIES TABLE (วางแผนการผลิต)
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS planning_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_date DATE NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('production', 'finishing')),
  line_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  target_qty INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_planning_entries_plan_date ON planning_entries(plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_planning_entries_department ON planning_entries(department);
CREATE INDEX IF NOT EXISTS idx_planning_entries_priority ON planning_entries(priority);
CREATE INDEX IF NOT EXISTS idx_planning_entries_status ON planning_entries(status);

-- Enable RLS
ALTER TABLE planning_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON planning_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON planning_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON planning_entries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON planning_entries FOR DELETE USING (true);

-- Auto-update trigger
CREATE TRIGGER update_planning_entries_updated_at
  BEFORE UPDATE ON planning_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
