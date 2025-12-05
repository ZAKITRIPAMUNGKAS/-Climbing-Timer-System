-- Migration: Allow NULL for climber_b_id to support BYE (Walkover)
-- This allows matches where a climber advances automatically without an opponent

USE fpti_karanganyar;

-- Modify climber_b_id to allow NULL
ALTER TABLE speed_finals_matches 
MODIFY COLUMN climber_b_id INT NULL;

-- Update foreign key constraint to allow NULL
-- Note: MySQL automatically handles NULL in foreign keys, but we should verify
-- If there's an explicit constraint, we may need to drop and recreate it

-- Verify the change
SELECT 
    COLUMN_NAME, 
    IS_NULLABLE, 
    COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'fpti_karanganyar' 
  AND TABLE_NAME = 'speed_finals_matches' 
  AND COLUMN_NAME = 'climber_b_id';

