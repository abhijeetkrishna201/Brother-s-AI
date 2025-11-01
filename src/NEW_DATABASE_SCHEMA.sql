-- ============================================================================
-- BROTHERS AI - NEW DATABASE SCHEMA
-- ============================================================================
-- Complete database redesign with simplified structure
-- 
-- TABLES:
-- 1. users - User authentication and profile data
-- 2. chat_history - Flattened chat history (one row per user-AI exchange)
-- ============================================================================

-- Drop existing tables if they exist (CAUTION: This will delete all data!)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
-- Stores user authentication and profile information
-- user_id is the email address

CREATE TABLE users (
  user_id TEXT PRIMARY KEY,           -- Email address used as user ID
  email TEXT NOT NULL UNIQUE,         -- Email address (same as user_id)
  password TEXT,                      -- Plain text password (for simplicity)
  mobile_no TEXT,                     -- Mobile number
  first_name TEXT,                    -- User's first name
  last_name TEXT,                     -- User's last name
  profile_picture TEXT,               -- URL to profile picture
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TABLE 2: chat_history
-- ============================================================================
-- Stores all chat exchanges (user requests and AI responses)
-- chat_id format: user_id + chat_rank (e.g., "user@example.com1", "user@example.com2")

CREATE TABLE chat_history (
  chat_id TEXT PRIMARY KEY,           -- user_id + rank (e.g., "user@example.com5")
  user_id TEXT NOT NULL,              -- References users.user_id
  user_request TEXT NOT NULL,         -- User's message/question
  ai_response TEXT NOT NULL,          -- AI's response
  chat_rank INTEGER NOT NULL,         -- Sequential number for this user's chats
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE UNIQUE INDEX idx_chat_history_user_rank ON chat_history(user_id, chat_rank);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - DISABLED FOR SIMPLICITY
-- ============================================================================
-- Note: RLS is disabled to simplify the implementation
-- In production, you should enable RLS and create appropriate policies

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get next chat rank for a user
-- ============================================================================
-- Returns the next available chat_rank for a user

CREATE OR REPLACE FUNCTION get_next_chat_rank(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_rank INTEGER;
BEGIN
  SELECT COALESCE(MAX(chat_rank), 0) + 1
  INTO next_rank
  FROM chat_history
  WHERE user_id = p_user_id;
  
  RETURN next_rank;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Create chat entry
-- ============================================================================
-- Creates a new chat entry and returns the chat_id

CREATE OR REPLACE FUNCTION create_chat_entry(
  p_user_id TEXT,
  p_user_request TEXT,
  p_ai_response TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_chat_rank INTEGER;
  v_chat_id TEXT;
BEGIN
  -- Get next chat rank
  v_chat_rank := get_next_chat_rank(p_user_id);
  
  -- Generate chat_id
  v_chat_id := p_user_id || v_chat_rank;
  
  -- Insert chat entry
  INSERT INTO chat_history (chat_id, user_id, user_request, ai_response, chat_rank)
  VALUES (v_chat_id, p_user_id, p_user_request, p_ai_response, v_chat_rank);
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert a sample user
INSERT INTO users (user_id, email, password, mobile_no, first_name, last_name)
VALUES 
  ('test@example.com', 'test@example.com', 'password123', '+1234567890', 'Test', 'User')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample chat history
INSERT INTO chat_history (chat_id, user_id, user_request, ai_response, chat_rank)
VALUES 
  ('test@example.com1', 'test@example.com', 'Hello!', 'Hi! How can I help you today?', 1),
  ('test@example.com2', 'test@example.com', 'What can you do?', 'I can help you with various tasks including answering questions, coding assistance, and more!', 2)
ON CONFLICT (chat_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check users table
SELECT 'Users count:' as info, COUNT(*) as count FROM users;

-- Check chat_history table
SELECT 'Chat history count:' as info, COUNT(*) as count FROM chat_history;

-- View all chat history for test user
SELECT chat_id, user_request, ai_response, created_at 
FROM chat_history 
WHERE user_id = 'test@example.com'
ORDER BY chat_rank;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your new database schema is ready to use.
-- 
-- Next steps:
-- 1. Update your application code to use the new schema
-- 2. Test the authentication flow
-- 3. Test chat history creation and retrieval
-- ============================================================================
