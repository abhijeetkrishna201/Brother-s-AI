-- ============================================
-- 🔧 CRITICAL: RUN THIS SQL FIRST!
-- ============================================
-- This adds email, phone, password, and name columns to the users table.
-- Without this, authentication will fail with "email column not found" error.
--
-- WHERE TO RUN:
-- 1. Go to: https://app.supabase.com/project/lfgffpfenynxhvxicdue
-- 2. Click "SQL Editor" in left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste ALL of this SQL
-- 5. Click "Run" or press Ctrl+Enter
-- ============================================

-- Step 1: Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 2: Add unique constraint on email (after column is created)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- Step 3: Migrate existing data
UPDATE users 
SET name = username 
WHERE name IS NULL AND username IS NOT NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password);

-- ============================================
-- ✅ VERIFICATION
-- ============================================
-- Run this to verify the migration worked:

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN column_name = 'email' THEN '✅ Required for login'
        WHEN column_name = 'name' THEN '✅ Required for profile'
        WHEN column_name = 'phone' THEN '✅ Optional'
        WHEN column_name = 'password' THEN '✅ Optional (skip OTP)'
        ELSE ''
    END as notes
FROM information_schema.columns
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'email', 'name', 'phone', 'password', 'username')
ORDER BY 
    CASE column_name
        WHEN 'id' THEN 1
        WHEN 'email' THEN 2
        WHEN 'name' THEN 3
        WHEN 'phone' THEN 4
        WHEN 'password' THEN 5
        WHEN 'username' THEN 6
    END;

-- ============================================
-- 📊 Expected Result:
-- ============================================
-- You should see these columns:
-- 
-- column_name | data_type | is_nullable | notes
-- ------------|-----------|-------------|---------------------------
-- id          | text      | NO          |
-- email       | text      | YES         | ✅ Required for login
-- name        | text      | YES         | ✅ Required for profile  
-- phone       | text      | YES         | ✅ Optional
-- password    | text      | YES         | ✅ Optional (skip OTP)
-- username    | text      | YES         |
-- ============================================

-- ✅ If you see all columns above, YOU'RE DONE!
-- ✅ Your authentication system is now ready to use!
-- 
-- ❌ If any columns are missing, re-run the migration above.
-- ❌ If you get errors, check the Supabase logs or contact support.
