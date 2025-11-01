-- ============================================================================
-- ADMIN TABLE SCHEMA V2 - Brothers AI
-- ============================================================================
-- Enhanced schema with Supabase configuration management
-- Includes: API keys, credentials, EmailJS settings, Supabase config
-- ============================================================================

-- Drop existing admin table if it exists (for clean setup)
DROP TABLE IF EXISTS admin CASCADE;

-- Create admin table with Supabase configuration
CREATE TABLE admin (
  admin_id TEXT PRIMARY KEY DEFAULT 'admin_001',
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  
  -- AI Configuration
  gemini_api_key TEXT,
  
  -- UI Customization
  user_profile_picture TEXT,
  default_message TEXT,
  
  -- EmailJS Configuration
  emailjs_service_id TEXT,
  emailjs_template_id TEXT,
  emailjs_public_key TEXT,
  
  -- Supabase Configuration
  supabase_url TEXT,
  supabase_anon_key TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_admin_username ON admin(username);

-- Insert default admin credentials
INSERT INTO admin (
  admin_id,
  username,
  password,
  gemini_api_key,
  user_profile_picture,
  default_message,
  emailjs_service_id,
  emailjs_template_id,
  emailjs_public_key,
  supabase_url,
  supabase_anon_key
) VALUES (
  'admin_001',
  'abhijeetkrishna201',
  'abhijeet@408166',
  NULL, -- API key will be set via Admin Settings
  'https://lfgffpfenynxhvxicdue.supabase.co/storage/v1/object/public/avatars/default-avatar.png',
  'I am Brother''s AI, created by Mr. Abhijeet Krishna Budhak. He is a 3rd-year B.Tech Computer Science and Engineering student studying at Ballarpur Institute of Technology. This chatbot is powered by Gemini AI, Google''s advanced language model.

I''m here to assist you with various tasks including answering questions, helping with coding problems, providing explanations on technical topics, and engaging in meaningful conversations. Feel free to ask me anything you''d like to know!',
  'service_hfh8ck9',
  'template_pqpt08d',
  'h1f1INzu2-UcVYddw',
  'https://lfgffpfenynxhvxicdue.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZ2ZmcGZlbnlueGh2eGljZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzQxNDAsImV4cCI6MjA3NTI1MDE0MH0.Er8efWbWXw8-Wi6T1uGNBl0M89RKIGtwfmrEsQUvvKg'
)
ON CONFLICT (admin_id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  emailjs_service_id = EXCLUDED.emailjs_service_id,
  emailjs_template_id = EXCLUDED.emailjs_template_id,
  emailjs_public_key = EXCLUDED.emailjs_public_key,
  supabase_url = EXCLUDED.supabase_url,
  supabase_anon_key = EXCLUDED.supabase_anon_key;

-- Enable Row Level Security (RLS)
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations (since we're using service role key)
-- In production, you should restrict this based on your auth system
CREATE POLICY "Allow all operations on admin table"
  ON admin
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS admin_updated_at ON admin;
CREATE TRIGGER admin_updated_at
  BEFORE UPDATE ON admin
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the table was created successfully:
-- SELECT * FROM admin;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get admin config
-- SELECT * FROM admin WHERE admin_id = 'admin_001';

-- Update Gemini API Key
-- UPDATE admin SET gemini_api_key = 'your-api-key-here' WHERE admin_id = 'admin_001';

-- Update Supabase Configuration
-- UPDATE admin 
-- SET 
--   supabase_url = 'https://your-project.supabase.co',
--   supabase_anon_key = 'your-anon-key'
-- WHERE admin_id = 'admin_001';

-- Update EmailJS settings
-- UPDATE admin 
-- SET 
--   emailjs_service_id = 'service_xxx',
--   emailjs_template_id = 'template_xxx',
--   emailjs_public_key = 'public_key_xxx'
-- WHERE admin_id = 'admin_001';

-- ============================================================================
-- MIGRATION GUIDE
-- ============================================================================
-- If you already have an admin table, run this to add new columns:
-- ALTER TABLE admin ADD COLUMN IF NOT EXISTS supabase_url TEXT;
-- ALTER TABLE admin ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;
-- 
-- Then update the values:
-- UPDATE admin SET 
--   supabase_url = 'https://lfgffpfenynxhvxicdue.supabase.co',
--   supabase_anon_key = 'your-current-anon-key'
-- WHERE admin_id = 'admin_001';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The admin_id is fixed as 'admin_001' (single admin system)
-- 2. Default credentials: abhijeetkrishna201 / abhijeet@408166
-- 3. All settings stored in database - NO localStorage or hardcoded values
-- 4. Supabase URL and keys are now configurable through admin panel
-- 5. RLS is enabled but allows all operations (adjust for production)
-- 6. updated_at is automatically updated on every change
-- 7. Security: Store sensitive keys encrypted in production
-- ============================================================================

COMMIT;
