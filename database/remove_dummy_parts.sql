-- This script will mark all existing Part Numbers as inactive 
-- (which is safer than deleting, so old history isn't broken)

-- 1. Mark all existing parts as inactive
UPDATE part_numbers
SET is_active = false
WHERE is_active = true;

-- 2. Alternatively, if you are SURE you want to DELETE them and they have NEVER been used in production/planning:
-- DELETE FROM part_numbers WHERE created_at < NOW();
--
-- Warning: If you delete parts that are referenced in planning_entries or production_entries,
-- it might cause foreign key errors or orphaned data!

-- The UPDATE statement above is the recommended approach.
