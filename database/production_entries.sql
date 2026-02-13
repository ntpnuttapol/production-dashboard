-- ═══════════════════════════════════════
-- PRODUCTION ENTRIES TABLE
-- ═══════════════════════════════════════

-- Create table for production entries
CREATE TABLE IF NOT EXISTS production_entries (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_production_entries_created_at ON production_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_entries_status ON production_entries(status);
CREATE INDEX IF NOT EXISTS idx_production_entries_shift ON production_entries(shift);
CREATE INDEX IF NOT EXISTS idx_production_entries_line_id ON production_entries(line_id);

-- Enable Row Level Security
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for CRUD operations
CREATE POLICY "Allow public read access" ON production_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON production_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON production_entries
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON production_entries
  FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_production_entries_updated_at
  BEFORE UPDATE ON production_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════
-- STORAGE BUCKET FOR IMAGES
-- ═══════════════════════════════════════

-- Create storage bucket for production images (run in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('production-images', 'production-images', true);

-- Storage policy for public access
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'production-images');
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'production-images');
