-- ====================================================
-- Brothers AI - Database Schema Update
-- ====================================================
-- This SQL script updates your users table to support
-- the enhanced authentication system with username/name.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
-- ====================================================

-- Step 1: Add new columns to users table (if they don't exist)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Step 2: Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 3: Migrate existing username data to name column
UPDATE users 
SET name = username 
WHERE name IS NULL AND username IS NOT NULL;

-- Step 4: Temporarily disable RLS for easier development
-- WARNING: Only use this in development! For production, set up proper RLS policies.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON conversations TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;

-- ====================================================
-- VERIFICATION QUERIES (Optional - run separately to check)
-- ====================================================
-- Uncomment and run these separately to verify the changes:

-- Check table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;

-- Check existing data:
-- SELECT id, username, name, email, created_at FROM users LIMIT 5;

-- ====================================================
-- SUCCESS!
-- ====================================================
-- If you see no errors, your database is ready!
-- You can now use the authentication system with full features.
-- ====================================================
