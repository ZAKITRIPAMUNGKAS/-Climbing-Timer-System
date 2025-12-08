-- Migration: Add audit_logs table for tracking appeals and critical actions
-- Date: 2024
-- Note: Ganti 'emsimemy_db' dengan nama database Anda jika berbeda

USE emsimemy_db;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'score', 'match', 'competition', etc.
    entity_id INT,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add is_finalized column to speed_qualification_scores if it doesn't exist
ALTER TABLE speed_qualification_scores 
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

-- Add is_finalized column to speed_finals_matches if it doesn't exist
ALTER TABLE speed_finals_matches 
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

-- Add is_locked column to scores table if it doesn't exist (for appeals)
ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

