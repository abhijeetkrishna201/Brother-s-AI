-- ============================================================================
-- TEST SCRIPT FOR NEW DATABASE SCHEMA
-- ============================================================================
-- Run these queries AFTER setting up the new database to verify everything works
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY TABLE STRUCTURE
-- ============================================================================

-- Check if users table exists
SELECT 'Users table exists:' as test, 
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'users'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check if chat_history table exists  
SELECT 'Chat history table exists:' as test,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'chat_history'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- ============================================================================
-- SECTION 2: VERIFY SAMPLE DATA
-- ============================================================================

-- Check if sample user exists
SELECT 'Sample user exists:' as test,
       CASE WHEN EXISTS (
           SELECT FROM users WHERE user_id = 'test@example.com'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Check if sample chats exist
SELECT 'Sample chats exist:' as test,
       CASE WHEN (SELECT COUNT(*) FROM chat_history WHERE user_id = 'test@example.com') >= 2
       THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- ============================================================================
-- SECTION 3: VIEW SAMPLE DATA
-- ============================================================================

-- View sample user
SELECT '=== Sample User ===' as info;
SELECT user_id, email, first_name, last_name, mobile_no 
FROM users 
WHERE user_id = 'test@example.com';

-- View sample chat history
SELECT '=== Sample Chat History ===' as info;
SELECT chat_id, chat_rank, user_request, ai_response 
FROM chat_history 
WHERE user_id = 'test@example.com'
ORDER BY chat_rank;

-- ============================================================================
-- SECTION 4: TEST HELPER FUNCTIONS
-- ============================================================================

-- Test get_next_chat_rank function
SELECT '=== Testing get_next_chat_rank() ===' as info;
SELECT get_next_chat_rank('test@example.com') as next_rank;
-- Expected: 3 (since there are 2 existing chats)

-- Test create_chat_entry function
SELECT '=== Testing create_chat_entry() ===' as info;
SELECT create_chat_entry(
    'test@example.com',
    'This is a test question?',
    'This is a test answer!'
) as created_chat_id;
-- Expected: test@example.com3

-- Verify the test chat was created
SELECT '=== Verify Test Chat Created ===' as info;
SELECT * FROM chat_history 
WHERE chat_id = 'test@example.com3';

-- ============================================================================
-- SECTION 5: TEST INSERT OPERATIONS
-- ============================================================================

-- Test: Create a new user
SELECT '=== Testing User Creation ===' as info;

INSERT INTO users (user_id, email, password, first_name, last_name, mobile_no)
VALUES (
    'testuser@gmail.com',
    'testuser@gmail.com',
    'password123',
    'Test',
    'User',
    '+1234567890'
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify user was created
SELECT 'New user created:' as test,
       CASE WHEN EXISTS (
           SELECT FROM users WHERE user_id = 'testuser@gmail.com'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Test: Create chat entries for new user
SELECT '=== Testing Chat Entry Creation ===' as info;

SELECT create_chat_entry(
    'testuser@gmail.com',
    'Hello! How are you?',
    'I am doing well, thank you for asking!'
);

SELECT create_chat_entry(
    'testuser@gmail.com',
    'What can you help me with?',
    'I can help you with various tasks including answering questions, coding assistance, and more!'
);

-- Verify chats were created
SELECT 'New chats created:' as test,
       CASE WHEN (SELECT COUNT(*) FROM chat_history WHERE user_id = 'testuser@gmail.com') = 2
       THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- ============================================================================
-- SECTION 6: TEST UPDATE OPERATIONS
-- ============================================================================

-- Test: Update user profile
SELECT '=== Testing User Update ===' as info;

UPDATE users 
SET first_name = 'Updated',
    last_name = 'Name',
    updated_at = NOW()
WHERE user_id = 'testuser@gmail.com';

-- Verify update
SELECT first_name, last_name FROM users WHERE user_id = 'testuser@gmail.com';

-- ============================================================================
-- SECTION 7: TEST QUERY OPERATIONS
-- ============================================================================

-- Test: Get all chats for a user ordered by rank
SELECT '=== User Chat History (Ordered) ===' as info;
SELECT chat_id, chat_rank, 
       LEFT(user_request, 30) as request,
       LEFT(ai_response, 30) as response
FROM chat_history 
WHERE user_id = 'testuser@gmail.com'
ORDER BY chat_rank ASC;

-- Test: Get latest chat
SELECT '=== Latest Chat ===' as info;
SELECT chat_id, user_request, ai_response
FROM chat_history 
WHERE user_id = 'testuser@gmail.com'
ORDER BY chat_rank DESC 
LIMIT 1;

-- Test: Count total chats per user
SELECT '=== Chats Per User ===' as info;
SELECT user_id, COUNT(*) as total_chats
FROM chat_history
GROUP BY user_id
ORDER BY total_chats DESC;

-- ============================================================================
-- SECTION 8: TEST DELETE OPERATIONS
-- ============================================================================

-- Test: Delete a specific chat
SELECT '=== Testing Chat Deletion ===' as info;

DELETE FROM chat_history 
WHERE chat_id = 'testuser@gmail.com1';

-- Verify deletion
SELECT 'Chat deleted:' as test,
       CASE WHEN NOT EXISTS (
           SELECT FROM chat_history WHERE chat_id = 'testuser@gmail.com1'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Test: Delete user (CASCADE should delete their chats)
SELECT '=== Testing User Deletion (CASCADE) ===' as info;

DELETE FROM users WHERE user_id = 'testuser@gmail.com';

-- Verify user deleted
SELECT 'User deleted:' as test,
       CASE WHEN NOT EXISTS (
           SELECT FROM users WHERE user_id = 'testuser@gmail.com'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Verify chats deleted (CASCADE)
SELECT 'User chats deleted (CASCADE):' as test,
       CASE WHEN NOT EXISTS (
           SELECT FROM chat_history WHERE user_id = 'testuser@gmail.com'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- ============================================================================
-- SECTION 9: TEST CONSTRAINTS
-- ============================================================================

-- Test: Try to insert duplicate user_id (should fail)
SELECT '=== Testing Unique Constraint ===' as info;

DO $$
BEGIN
    INSERT INTO users (user_id, email, password, first_name)
    VALUES ('test@example.com', 'test@example.com', 'pass', 'Test');
    
    RAISE NOTICE '❌ FAIL: Duplicate user_id was allowed!';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '✅ PASS: Duplicate user_id blocked correctly';
END $$;

-- Test: Try to insert chat with invalid user_id (should fail)
SELECT '=== Testing Foreign Key Constraint ===' as info;

DO $$
BEGIN
    INSERT INTO chat_history (chat_id, user_id, user_request, ai_response, chat_rank)
    VALUES ('invalid@test.com1', 'invalid@test.com', 'Test', 'Test', 1);
    
    RAISE NOTICE '❌ FAIL: Invalid user_id was allowed!';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE '✅ PASS: Invalid user_id blocked correctly';
END $$;

-- ============================================================================
-- SECTION 10: PERFORMANCE TESTS
-- ============================================================================

-- Test: Query speed for fetching user chats
SELECT '=== Performance Test: Fetch User Chats ===' as info;

EXPLAIN ANALYZE
SELECT * FROM chat_history 
WHERE user_id = 'test@example.com'
ORDER BY chat_rank;

-- Test: Query speed for counting chats
SELECT '=== Performance Test: Count Chats ===' as info;

EXPLAIN ANALYZE
SELECT COUNT(*) FROM chat_history 
WHERE user_id = 'test@example.com';

-- ============================================================================
-- SECTION 11: FINAL SUMMARY
-- ============================================================================

SELECT '=== FINAL SUMMARY ===' as info;

SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM chat_history) as total_chats,
    (SELECT COUNT(DISTINCT user_id) FROM chat_history) as users_with_chats;

-- ============================================================================
-- SECTION 12: CLEANUP TEST DATA (Optional)
-- ============================================================================

-- Uncomment these lines if you want to remove the test chat we created
-- DELETE FROM chat_history WHERE chat_id = 'test@example.com3';

-- ============================================================================
-- ALL TESTS COMPLETE!
-- ============================================================================

SELECT '✅ ALL TESTS COMPLETE!' as status;
SELECT 'Check the results above to verify everything works correctly.' as note;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

/*
If everything is set up correctly, you should see:

✅ All table existence checks PASS
✅ Sample data checks PASS
✅ Helper functions work correctly
✅ Insert operations succeed
✅ Update operations succeed
✅ Delete operations succeed
✅ Constraints enforced correctly
✅ Performance is acceptable

Sample user data:
- user_id: test@example.com
- 2-3 chat entries

Final Summary:
- total_users: 1 (or more)
- total_chats: 2-3 (or more)
- users_with_chats: 1 (or more)
*/
