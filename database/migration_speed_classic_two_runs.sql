-- Migration: Add two-run support for Speed Classic Finals
-- Each climber now runs twice (Lane A + Lane B) in every match
-- Winner is determined by total time (run1 + run2)

ALTER TABLE speed_finals_matches
ADD COLUMN climber_a_run1_time DECIMAL(6,3) DEFAULT NULL COMMENT 'Climber A Run 1 (Lane A)',
ADD COLUMN climber_a_run2_time DECIMAL(6,3) DEFAULT NULL COMMENT 'Climber A Run 2 (Lane B)',
ADD COLUMN climber_a_total_time DECIMAL(7,3) DEFAULT NULL COMMENT 'Climber A Total (run1 + run2)',
ADD COLUMN climber_b_run1_time DECIMAL(6,3) DEFAULT NULL COMMENT 'Climber B Run 1 (Lane A)',
ADD COLUMN climber_b_run2_time DECIMAL(6,3) DEFAULT NULL COMMENT 'Climber B Run 2 (Lane B)',
ADD COLUMN climber_b_total_time DECIMAL(7,3) DEFAULT NULL COMMENT 'Climber B Total (run1 + run2)',
ADD COLUMN climber_a_run1_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
ADD COLUMN climber_a_run2_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
ADD COLUMN climber_b_run1_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
ADD COLUMN climber_b_run2_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID';

-- Note: Keep time_a, time_b, status_a, status_b for backward compatibility
-- They can be deprecated later or used for single-run matches if needed

