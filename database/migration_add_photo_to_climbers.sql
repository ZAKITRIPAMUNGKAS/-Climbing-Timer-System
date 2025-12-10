-- Migration: Add photo column to climbers table
-- Date: 2024

ALTER TABLE climbers 
ADD COLUMN photo VARCHAR(500) DEFAULT NULL AFTER team;

-- Also add to speed_climbers for consistency
ALTER TABLE speed_climbers 
ADD COLUMN photo VARCHAR(500) DEFAULT NULL AFTER team;

