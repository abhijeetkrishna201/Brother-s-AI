-- ============================================
-- Brother's AI - User Schema Update
-- ============================================
-- This script adds first_name and last_name columns
-- and prepares the database to use email as user ID
--
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================

-- Add first_name and last_name columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update existing users to populate first_name from username
-- This migration helps existing users by copying their username to first_name
UPDATE users
SET first_name = username
WHERE first_name IS NULL AND username IS NOT NULL;

-- Create an index on email for faster lookups since we're using it as ID
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update the username to be first_name for consistency
UPDATE users
SET username = first_name
WHERE username IS NULL AND first_name IS NOT NULL;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. New users will have email as their ID (id column)
-- 2. Existing users will keep their current ID format
-- 3. All new signups will use first name and last name
-- 4. The username field will be set to first_name for display
-- ============================================

-- View updated schema
SELECT 
  id,
  email,
  username,
  first_name,
  last_name,
  name,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
