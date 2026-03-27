-- =====================================================
-- MANAGE PRODUCTION LINES IN DATABASE
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- 1. Create the base table
CREATE TABLE IF NOT EXISTS lines (
  id TEXT PRIMARY KEY, -- e.g. 'LINE-01'
  name TEXT NOT NULL,  -- e.g. 'สายการผลิต A'
  department TEXT NOT NULL CHECK (department IN ('production', 'finishing')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add RLS (Row Level Security)
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or public) to read the lines
DROP POLICY IF EXISTS "Allow public read access to lines" ON lines;
CREATE POLICY "Allow public read access to lines" ON lines FOR SELECT USING (true);

-- Allow admins to insert/update/delete (you can leave this true if using RPCs or verify via app)
DROP POLICY IF EXISTS "Allow all access to lines" ON lines;
CREATE POLICY "Allow all access to lines" ON lines FOR ALL USING (true) WITH CHECK (true);

-- 3. Insert existing hardcoded lines
INSERT INTO lines (id, name, department) VALUES
  ('LINE-01', 'สายการผลิต A', 'production'),
  ('LINE-02', 'สายการผลิต B', 'production'),
  ('LINE-03', 'สายการผลิต C', 'production'),
  ('LINE-04', 'สายการผลิต D', 'production'),
  ('LINE-05', 'สายการผลิต E', 'production'),
  ('LINE-06', 'สายการผลิต F', 'production'),
  ('FINISH-01', 'สายประกอบ A', 'finishing'),
  ('FINISH-02', 'สายประกอบ B', 'finishing'),
  ('FINISH-03', 'สายประกอบ C', 'finishing'),
  ('FINISH-04', 'สายประกอบ D', 'finishing')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  department = EXCLUDED.department;

-- 4. Create an RPC function for admins to easily upsert lines
CREATE OR REPLACE FUNCTION upsert_line(
  p_id TEXT,
  p_name TEXT,
  p_department TEXT,
  p_is_active BOOLEAN
) RETURNS jsonb AS $$
BEGIN
  INSERT INTO lines (id, name, department, is_active, updated_at)
  VALUES (p_id, p_name, p_department, p_is_active, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
    
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
