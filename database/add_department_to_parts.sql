-- Migration: Add department column to part_numbers
-- Run this in Supabase SQL Editor

ALTER TABLE part_numbers
ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'production'
CHECK (department IN ('production', 'finishing'));

-- (Optional) Update existing records if you know which parts belong to which dept:
-- UPDATE part_numbers SET department = 'finishing' WHERE part_number LIKE 'FIN-%';
-- UPDATE part_numbers SET department = 'production' WHERE part_number LIKE 'PROD-%';
