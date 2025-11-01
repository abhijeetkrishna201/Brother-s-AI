-- =====================================================
-- FIX MESSAGES TABLE - Add conversation_id column
-- =====================================================
-- This SQL script fixes the messages table schema by adding
-- the missing conversation_id column and foreign key constraint
-- 
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/lfgffpfenynxhvxicdue/sql
-- =====================================================

-- Step 1: Check if conversation_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'conversation_id'
    ) THEN
        -- Add the conversation_id column
        ALTER TABLE messages 
        ADD COLUMN conversation_id TEXT NOT NULL DEFAULT 'temp_conversation';
        
        RAISE NOTICE '✅ Added conversation_id column to messages table';
    ELSE
        RAISE NOTICE '✅ conversation_id column already exists';
    END IF;
END $$;

-- Step 2: Create index on conversation_id for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

-- Step 3: Add foreign key constraint to ensure referential integrity
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_messages_conversation_id'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT fk_messages_conversation_id
        FOREIGN KEY (conversation_id) 
        REFERENCES conversations(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added foreign key constraint';
    ELSE
        RAISE NOTICE '✅ Foreign key constraint already exists';
    END IF;
END $$;

-- Step 4: Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'conversation_id'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: messages.conversation_id column is ready!';
    ELSE
        RAISE NOTICE '❌ ERROR: conversation_id column was not added';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the schema is correct:
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- You should see these columns:
-- id               | text      | NO  | (no default)
-- content          | text      | NO  | (no default)
-- role             | text      | NO  | (no default)
-- timestamp        | text      | NO  | (no default)
-- attachments      | jsonb     | YES | (null)
-- created_at       | timestamp | NO  | now()
-- conversation_id  | text      | NO  | 'temp_conversation'
-- =====================================================

-- TROUBLESHOOTING:
-- If you see errors, you may need to:
-- 1. Make sure the conversations table exists first
-- 2. Check RLS policies are not blocking the ALTER TABLE
-- 3. Ensure you have sufficient permissions
-- =====================================================
