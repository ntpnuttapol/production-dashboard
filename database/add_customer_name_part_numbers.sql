-- Add Customer Name to Part Numbers target table

ALTER TABLE part_numbers 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Update the view or functions if they exist (none identified for part_numbers specifically)
