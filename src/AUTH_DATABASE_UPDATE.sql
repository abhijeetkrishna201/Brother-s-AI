-- ============================================
-- Enhanced Authentication Schema Update
-- Add email, phone, and password fields to users table
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update username column to be name if not already updated
-- (This is for backward compatibility)
UPDATE users 
SET name = username 
WHERE name IS NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on password for faster authentication  
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password);

-- Update RLS policies to allow email-based queries
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Verification Queries
-- ============================================

-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND schemaname = 'public';

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see email, phone, password, and name columns above,
-- your database is ready for the new authentication system!
--
-- You can now:
-- ✅ Login with email + OTP
-- ✅ Login with email + password  
-- ✅ Collect user profiles (name, phone)
-- ✅ Store everything in database
-- ============================================
