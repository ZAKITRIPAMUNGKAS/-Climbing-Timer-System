-- Migration: Rename age column to school in athletes table
-- Date: 2024

ALTER TABLE athletes 
CHANGE COLUMN age school VARCHAR(255) NOT NULL;

