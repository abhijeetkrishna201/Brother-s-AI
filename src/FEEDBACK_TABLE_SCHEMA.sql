-- ============================================================================
-- FEEDBACK TABLE SCHEMA
-- ============================================================================
-- Stores user feedback directly in the database instead of sending emails
-- ============================================================================

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id TEXT PRIMARY KEY,           -- Unique ID: "feedback_" + timestamp + random
  user_id TEXT,                           -- User ID (email) - can be NULL for anonymous
  feedback_text TEXT NOT NULL,            -- The feedback message
  user_name TEXT,                         -- Optional: User's name
  contact_info TEXT,                      -- Optional: Email/phone for follow-up
  feedback_type TEXT DEFAULT 'general',   -- Type: general, bug, suggestion, praise
  status TEXT DEFAULT 'new',              -- Status: new, reviewed, resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key constraint (optional - allows anonymous feedback)
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) 
    REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for faster queries
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);

-- ============================================================================
-- ROW LEVEL SECURITY - DISABLED FOR SIMPLICITY
-- ============================================================================
-- Note: RLS is disabled to allow anonymous feedback submission
-- In production, you should enable RLS with appropriate policies

ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Create feedback entry
-- ============================================================================
-- Creates a new feedback entry and returns the feedback_id

CREATE OR REPLACE FUNCTION create_feedback_entry(
  p_user_id TEXT,
  p_feedback_text TEXT,
  p_user_name TEXT DEFAULT NULL,
  p_contact_info TEXT DEFAULT NULL,
  p_feedback_type TEXT DEFAULT 'general'
)
RETURNS TEXT AS $$
DECLARE
  v_feedback_id TEXT;
BEGIN
  -- Generate feedback_id
  v_feedback_id := 'feedback_' || 
                   EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                   SUBSTR(MD5(RANDOM()::TEXT), 1, 8);
  
  -- Insert feedback entry
  INSERT INTO feedback (
    feedback_id, 
    user_id, 
    feedback_text, 
    user_name, 
    contact_info, 
    feedback_type,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_feedback_id, 
    p_user_id, 
    p_feedback_text, 
    p_user_name, 
    p_contact_info, 
    p_feedback_type,
    'new',
    NOW(),
    NOW()
  );
  
  RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Get all feedback (for admin)
-- ============================================================================
-- Returns all feedback entries ordered by creation date

CREATE OR REPLACE FUNCTION get_all_feedback(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  feedback_id TEXT,
  user_id TEXT,
  feedback_text TEXT,
  user_name TEXT,
  contact_info TEXT,
  feedback_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.feedback_id,
    f.user_id,
    f.feedback_text,
    f.user_name,
    f.contact_info,
    f.feedback_type,
    f.status,
    f.created_at
  FROM feedback f
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Update feedback status
-- ============================================================================
-- Updates the status of a feedback entry

CREATE OR REPLACE FUNCTION update_feedback_status(
  p_feedback_id TEXT,
  p_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE feedback
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE feedback_id = p_feedback_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert a sample feedback
INSERT INTO feedback (
  feedback_id, 
  user_id, 
  feedback_text, 
  user_name, 
  contact_info, 
  feedback_type
)
VALUES 
  (
    'feedback_test_1',
    'test@example.com',
    'Great AI chatbot! Very helpful and responsive.',
    'Test User',
    'test@example.com',
    'praise'
  )
ON CONFLICT (feedback_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check feedback table
SELECT 'Feedback count:' as info, COUNT(*) as count FROM feedback;

-- View all feedback
SELECT 
  feedback_id,
  user_name,
  feedback_text,
  feedback_type,
  status,
  created_at
FROM feedback
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your feedback table is ready to use.
-- 
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update your application code to use the new feedback table
-- 3. Test feedback submission
-- ============================================================================
