-- ═══════════════════════════════════════
-- CUSTOMERS Table
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON customers FOR DELETE USING (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════
-- ALTER PART_NUMBERS - Add customer_id Migration
-- ═══════════════════════════════════════

ALTER TABLE part_numbers 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Optional: If you want to drop the old customer_name column from part_numbers after migrating data:
-- ALTER TABLE part_numbers DROP COLUMN IF EXISTS customer_name;
