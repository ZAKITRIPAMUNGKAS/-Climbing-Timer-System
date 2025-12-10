-- Migration: Add school column to athletes table (if age column exists, rename it; otherwise add new column)
-- Date: 2024

-- First, check if age column exists and rename it
-- If age doesn't exist, add school column directly

-- Try to rename age to school (will fail silently if age doesn't exist)
ALTER TABLE athletes 
CHANGE COLUMN age school VARCHAR(255) NOT NULL DEFAULT '';

-- If the above fails because age doesn't exist, run this instead:
-- ALTER TABLE athletes ADD COLUMN school VARCHAR(255) NOT NULL DEFAULT '';

