-- ============================================================================
-- MIGRATION SCRIPT: Add Database Configuration to Admin Table
-- ============================================================================
-- Run this if you already have an admin table and want to add new columns
-- ============================================================================

-- Add new columns for Supabase configuration
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS supabase_url TEXT,
ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;

-- Update existing admin record with default values
UPDATE admin 
SET 
  supabase_url = COALESCE(supabase_url, 'https://lfgffpfenynxhvxicdue.supabase.co'),
  supabase_anon_key = COALESCE(supabase_anon_key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZ2ZmcGZlbnlueGh2eGljZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzQxNDAsImV4cCI6MjA3NTI1MDE0MH0.Er8efWbWXw8-Wi6T1uGNBl0M89RKIGtwfmrEsQUvvKg')
WHERE admin_id = 'admin_001';

-- Verify the migration
SELECT 
  admin_id,
  username,
  gemini_api_key IS NOT NULL as has_api_key,
  emailjs_service_id,
  supabase_url,
  LENGTH(supabase_anon_key) as anon_key_length,
  created_at,
  updated_at
FROM admin 
WHERE admin_id = 'admin_001';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see the admin record with supabase_url and anon_key_length > 0,
-- the migration was successful!
-- 
-- Next steps:
-- 1. Login to admin panel
-- 2. Go to Database tab
-- 3. Update with your actual Supabase credentials
-- 4. Save and refresh the page
-- ============================================================================

COMMIT;
