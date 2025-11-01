-- ============================================================================
-- CLEANUP DUPLICATE CHAT ENTRIES
-- ============================================================================
-- This script removes duplicate chat entries from the chat_history table
-- Use this if you have duplicate messages stored in your database
-- ============================================================================

-- STEP 1: View current duplicates (DIAGNOSTIC - RUN THIS FIRST)
-- ============================================================================
-- This shows you which entries are duplicates
SELECT 
  user_id,
  user_request,
  ai_response,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(chat_id ORDER BY created_at) as chat_ids,
  ARRAY_AGG(chat_rank ORDER BY created_at) as ranks
FROM chat_history
GROUP BY user_id, user_request, ai_response
HAVING COUNT(*) > 1
ORDER BY user_id, MIN(created_at);

-- ============================================================================
-- STEP 2: Remove duplicates (KEEPS THE FIRST ENTRY, DELETES LATER ONES)
-- ============================================================================
-- WARNING: This will delete data! Make sure you've reviewed Step 1 results first

-- Method 1: Delete duplicates keeping the earliest created entry
DELETE FROM chat_history
WHERE chat_id IN (
  SELECT chat_id
  FROM (
    SELECT 
      chat_id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, user_request, ai_response 
        ORDER BY created_at ASC
      ) as row_num
    FROM chat_history
  ) t
  WHERE row_num > 1
);

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================
-- After running Step 2, run this to verify no more duplicates exist

SELECT 
  user_id,
  user_request,
  ai_response,
  COUNT(*) as count
FROM chat_history
GROUP BY user_id, user_request, ai_response
HAVING COUNT(*) > 1;

-- Should return 0 rows if cleanup was successful

-- ============================================================================
-- STEP 4: Rebuild chat_rank sequence (IMPORTANT!)
-- ============================================================================
-- After removing duplicates, chat_rank values might have gaps
-- This reassigns sequential chat_rank values per user

-- Create a temporary table with corrected ranks
CREATE TEMP TABLE chat_history_reranked AS
SELECT 
  chat_id,
  user_id,
  user_request,
  ai_response,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_rank,
  created_at,
  updated_at
FROM chat_history;

-- Update the original table with corrected ranks
UPDATE chat_history
SET chat_rank = chr.new_rank,
    chat_id = user_id || chr.new_rank::text
FROM chat_history_reranked chr
WHERE chat_history.chat_id = chr.chat_id;

-- Drop the temporary table
DROP TABLE chat_history_reranked;

-- ============================================================================
-- STEP 5: Verify final state
-- ============================================================================
-- Check that ranks are now sequential for each user

SELECT 
  user_id,
  chat_rank,
  LEFT(user_request, 50) as request_preview,
  created_at
FROM chat_history
WHERE user_id = 'YOUR_EMAIL_HERE'  -- Replace with your email
ORDER BY chat_rank;

-- Should show sequential ranks: 1, 2, 3, 4, 5...

-- ============================================================================
-- ALTERNATIVE: If you want to start fresh
-- ============================================================================
-- WARNING: This deletes ALL chat history for a specific user
-- Uncomment and modify if needed

-- DELETE FROM chat_history WHERE user_id = 'YOUR_EMAIL_HERE';

-- ============================================================================
-- BACKUP BEFORE CLEANUP (RECOMMENDED)
-- ============================================================================
-- Create a backup table before running cleanup

-- CREATE TABLE chat_history_backup AS SELECT * FROM chat_history;

-- To restore from backup:
-- TRUNCATE chat_history;
-- INSERT INTO chat_history SELECT * FROM chat_history_backup;

-- ============================================================================
-- STATISTICS
-- ============================================================================
-- Get statistics about your chat history

SELECT 
  user_id,
  COUNT(*) as total_chats,
  MIN(chat_rank) as min_rank,
  MAX(chat_rank) as max_rank,
  MIN(created_at) as first_chat,
  MAX(created_at) as last_chat
FROM chat_history
GROUP BY user_id
ORDER BY total_chats DESC;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
-- 1. Run STEP 1 to see duplicates
-- 2. Create backup (optional but recommended)
-- 3. Run STEP 2 to remove duplicates
-- 4. Run STEP 3 to verify duplicates are gone
-- 5. Run STEP 4 to fix chat_rank sequence
-- 6. Run STEP 5 to verify final state
-- ============================================================================
