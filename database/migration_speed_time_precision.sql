-- Migration: Change speed time columns from DECIMAL(5,2) to DECIMAL(6,3) for 3 decimal precision
-- Date: 2024

-- Update speed_qualification_scores table
ALTER TABLE speed_qualification_scores 
MODIFY COLUMN lane_a_time DECIMAL(6,3) DEFAULT NULL;

ALTER TABLE speed_qualification_scores 
MODIFY COLUMN lane_b_time DECIMAL(6,3) DEFAULT NULL;

ALTER TABLE speed_qualification_scores 
MODIFY COLUMN total_time DECIMAL(7,3) DEFAULT NULL;

-- Update speed_finals_matches table
ALTER TABLE speed_finals_matches 
MODIFY COLUMN time_a DECIMAL(6,3) DEFAULT NULL;

ALTER TABLE speed_finals_matches 
MODIFY COLUMN time_b DECIMAL(6,3) DEFAULT NULL;

