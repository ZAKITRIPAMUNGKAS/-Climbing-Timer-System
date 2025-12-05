-- Migration: Add role column to users table
-- Run this SQL script to add the role column to existing users table

USE fpti_karanganyar;

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN role ENUM('admin', 'judge', 'timer') DEFAULT 'judge' AFTER password;

-- Update existing users to have 'admin' role (assuming they are admins)
UPDATE users SET role = 'admin' WHERE role IS NULL OR role = 'judge';

