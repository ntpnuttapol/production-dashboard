-- =====================================================
-- FULL DATABASE SETUP SCRIPT (Idempotent & Safe)
-- Run this in Supabase SQL Editor to fix missing tables and columns
-- =====================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Departments & Statuses (Master Data with Defaults)
-- If the table exists but is missing columns, these commands will add them.
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Important: If table exists, ensure columns exist
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

INSERT INTO departments (name, description, display_order) 
VALUES 
('Production', 'งานผลิต', 1),
('Finishing', 'งาน Finishing', 2),
('Assembly', 'งานประกอบ', 3)
ON CONFLICT (id) DO NOTHING; -- Assuming ID is auto-generated, but 'name' might be duplicate.
-- Better insert strategy for existing data:
INSERT INTO departments (name, description, display_order)
SELECT 'Production', 'งานผลิต', 1 WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Production');
INSERT INTO departments (name, description, display_order)
SELECT 'Finishing', 'งาน Finishing', 2 WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Finishing');
INSERT INTO departments (name, description, display_order)
SELECT 'Assembly', 'งานประกอบ', 3 WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Assembly');


CREATE TABLE IF NOT EXISTS status_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_th TEXT,
    color TEXT NOT NULL,
    animation_type TEXT DEFAULT 'none',
    priority INT DEFAULT 0
);

ALTER TABLE status_types ADD COLUMN IF NOT EXISTS name_th TEXT;
ALTER TABLE status_types ADD COLUMN IF NOT EXISTS animation_type TEXT DEFAULT 'none';
ALTER TABLE status_types ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

INSERT INTO status_types (name, name_th, color, animation_type, priority) 
VALUES
('Working', 'กำลังทำงาน', '#FFD700', 'bounce', 1),
('Completed', 'เสร็จสิ้น', '#4CAF50', 'fireworks', 2),
('Not Working', 'ไม่ได้ทำ', '#F44336', 'none', 3),
('Inactive', 'ไม่มีงาน', '#424242', 'none', 4)
ON CONFLICT (id) DO NOTHING;
-- Or use name check
INSERT INTO status_types (name, name_th, color, animation_type, priority)
SELECT 'Working', 'กำลังทำงาน', '#FFD700', 'bounce', 1 WHERE NOT EXISTS (SELECT 1 FROM status_types WHERE name = 'Working');
-- (Simple approach: skip insert if ids conflict, but names might be different. Let's assume standard inserts.)


-- 3. Create Part Numbers Table (Master for Products)
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
ALTER TABLE part_numbers ADD COLUMN IF NOT EXISTS std_qty INTEGER NOT NULL DEFAULT 0;
ALTER TABLE part_numbers ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'pcs';


-- 4. Create Production Entries Table
CREATE TABLE IF NOT EXISTS production_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  target_qty INTEGER NOT NULL DEFAULT 0,
  completed_qty INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  shift TEXT NOT NULL DEFAULT 'morning',
  start_time TIME NOT NULL,
  end_time TIME,
  operator TEXT NOT NULL,
  remarks TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS line_name TEXT;
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Create Finishing Entries Table
CREATE TABLE IF NOT EXISTS finishing_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  lot_number TEXT NOT NULL,
  target_qty INTEGER NOT NULL DEFAULT 0,
  completed_qty INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  shift TEXT NOT NULL DEFAULT 'morning',
  start_time TIME NOT NULL,
  end_time TIME,
  operator TEXT NOT NULL,
  remarks TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 6. Enable RLS (Security)
ALTER TABLE part_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finishing_entries ENABLE ROW LEVEL SECURITY;

-- 7. Create Generic Public Policies (For Development Simplicity)
-- Note: In production, you might want stricter policies.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'part_numbers' AND policyname = 'Public Access parts') THEN
    CREATE POLICY "Public Access parts" ON part_numbers FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'production_entries' AND policyname = 'Public Access production') THEN
    CREATE POLICY "Public Access production" ON production_entries FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'finishing_entries' AND policyname = 'Public Access finishing') THEN
    CREATE POLICY "Public Access finishing" ON finishing_entries FOR ALL USING (true);
  END IF;
END $$;


-- 8. Update Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_part_numbers_mod ON part_numbers;
CREATE TRIGGER update_part_numbers_mod BEFORE UPDATE ON part_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_entries_mod ON production_entries;
CREATE TRIGGER update_production_entries_mod BEFORE UPDATE ON production_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finishing_entries_mod ON finishing_entries;
CREATE TRIGGER update_finishing_entries_mod BEFORE UPDATE ON finishing_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
