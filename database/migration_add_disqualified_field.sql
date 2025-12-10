-- Migration: Add is_disqualified field to scores table
-- Date: 2024
-- Note: Ganti 'emsimemy_db' dengan nama database Anda jika berbeda

USE emsimemy_db;

-- Add is_disqualified column to scores table if it doesn't exist
ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT FALSE;

