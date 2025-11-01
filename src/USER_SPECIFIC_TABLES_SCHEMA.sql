-- ==========================================
-- USER-SPECIFIC TABLES MIGRATION SCRIPT
-- ==========================================
-- This script creates a system where each user has their own tables
-- for conversations and messages, providing complete data isolation.
--
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Navigate to: Supabase Dashboard > SQL Editor > New Query > Paste this script > Run
--
-- ==========================================

-- Step 1: Create a function to generate table names
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_conversations_table(user_email TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Sanitize email to create a valid table name
  -- Replace special characters with underscores
  RETURN 'user_' || regexp_replace(lower(user_email), '[^a-z0-9]', '_', 'g') || '_conversations';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_messages_table(user_email TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Sanitize email to create a valid table name
  -- Replace special characters with underscores
  RETURN 'user_' || regexp_replace(lower(user_email), '[^a-z0-9]', '_', 'g') || '_messages';
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create function to initialize user tables
-- ==========================================
CREATE OR REPLACE FUNCTION initialize_user_tables(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  conversations_table TEXT;
  messages_table TEXT;
  table_exists BOOLEAN;
BEGIN
  -- Get table names
  conversations_table := get_user_conversations_table(user_email);
  messages_table := get_user_messages_table(user_email);
  
  -- Check if conversations table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = conversations_table
  ) INTO table_exists;
  
  -- Create conversations table if it doesn't exist
  IF NOT table_exists THEN
    EXECUTE format('
      CREATE TABLE %I (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        preview TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )', conversations_table);
    
    -- Create index on user_id
    EXECUTE format('CREATE INDEX idx_%I_user_id ON %I(user_id)', conversations_table, conversations_table);
    
    -- Create index on updated_at for sorting
    EXECUTE format('CREATE INDEX idx_%I_updated_at ON %I(updated_at DESC)', conversations_table, conversations_table);
    
    RAISE NOTICE 'Created conversations table: %', conversations_table;
  END IF;
  
  -- Check if messages table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = messages_table
  ) INTO table_exists;
  
  -- Create messages table if it doesn't exist
  IF NOT table_exists THEN
    EXECUTE format('
      CREATE TABLE %I (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN (''user'', ''assistant'')),
        timestamp TEXT NOT NULL,
        attachments JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )', messages_table);
    
    -- Create index on conversation_id
    EXECUTE format('CREATE INDEX idx_%I_conversation_id ON %I(conversation_id)', messages_table, messages_table);
    
    -- Create index on created_at for sorting
    EXECUTE format('CREATE INDEX idx_%I_created_at ON %I(created_at)', messages_table, messages_table);
    
    RAISE NOTICE 'Created messages table: %', messages_table;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating tables: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to migrate existing data
-- ==========================================
CREATE OR REPLACE FUNCTION migrate_user_data_to_personal_tables(user_email TEXT, user_id_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  conversations_table TEXT;
  messages_table TEXT;
  conversation_record RECORD;
  migration_count INTEGER := 0;
BEGIN
  -- Get table names
  conversations_table := get_user_conversations_table(user_email);
  messages_table := get_user_messages_table(user_email);
  
  -- First, ensure user tables exist
  PERFORM initialize_user_tables(user_email);
  
  -- Check if old tables exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    -- Migrate conversations
    FOR conversation_record IN 
      SELECT * FROM conversations WHERE user_id = user_id_value
    LOOP
      -- Insert into user-specific table
      EXECUTE format('
        INSERT INTO %I (id, user_id, title, preview, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      ', conversations_table)
      USING conversation_record.id, conversation_record.user_id, conversation_record.title, 
            conversation_record.preview, conversation_record.created_at, conversation_record.updated_at;
      
      migration_count := migration_count + 1;
      
      -- Migrate messages for this conversation
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        EXECUTE format('
          INSERT INTO %I (id, conversation_id, content, role, timestamp, attachments, created_at)
          SELECT id, conversation_id, content, role, timestamp, attachments, created_at
          FROM messages
          WHERE conversation_id = $1
          ON CONFLICT (id) DO NOTHING
        ', messages_table)
        USING conversation_record.id;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrated % conversations for user %', migration_count, user_email;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error migrating data: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create helper function to get user table statistics
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_table_stats(user_email TEXT)
RETURNS TABLE(
  conversations_table_name TEXT,
  messages_table_name TEXT,
  total_conversations BIGINT,
  total_messages BIGINT,
  tables_exist BOOLEAN
) AS $$
DECLARE
  conv_table TEXT;
  msg_table TEXT;
  conv_exists BOOLEAN;
  msg_exists BOOLEAN;
  conv_count BIGINT := 0;
  msg_count BIGINT := 0;
BEGIN
  -- Get table names
  conv_table := get_user_conversations_table(user_email);
  msg_table := get_user_messages_table(user_email);
  
  -- Check if tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = conv_table
  ) INTO conv_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = msg_table
  ) INTO msg_exists;
  
  -- Get counts if tables exist
  IF conv_exists THEN
    EXECUTE format('SELECT COUNT(*) FROM %I', conv_table) INTO conv_count;
  END IF;
  
  IF msg_exists THEN
    EXECUTE format('SELECT COUNT(*) FROM %I', msg_table) INTO msg_count;
  END IF;
  
  -- Return stats
  RETURN QUERY SELECT 
    conv_table,
    msg_table,
    conv_count,
    msg_count,
    (conv_exists AND msg_exists);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Grant necessary permissions
-- ==========================================
-- Allow service role to create tables and execute functions
GRANT EXECUTE ON FUNCTION get_user_conversations_table(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_messages_table(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION initialize_user_tables(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION migrate_user_data_to_personal_tables(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_table_stats(TEXT) TO anon, authenticated, service_role;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- After running this script, you can test with:
--
-- 1. Initialize tables for a test user:
--    SELECT initialize_user_tables('test@example.com');
--
-- 2. Check if tables were created:
--    SELECT * FROM get_user_table_stats('test@example.com');
--
-- 3. Migrate existing data for a user:
--    SELECT migrate_user_data_to_personal_tables('user@example.com', 'user@example.com');
--
-- 4. List all user-specific tables:
--    SELECT tablename FROM pg_tables 
--    WHERE schemaname = 'public' AND tablename LIKE 'user_%_conversations'
--    ORDER BY tablename;
--
-- ==========================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User-specific tables schema created successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Test with: SELECT initialize_user_tables(''test@example.com'');';
  RAISE NOTICE '   2. Verify with: SELECT * FROM get_user_table_stats(''test@example.com'');';
  RAISE NOTICE '   3. Update your application code to use the new database service';
END $$;
