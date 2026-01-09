-- ============================================================================
-- Schema Verification Script
-- ============================================================================
-- Run this in Supabase SQL Editor to verify all tables and columns exist
-- This will show you exactly what's missing
-- ============================================================================

DO $$
DECLARE
    table_name_var TEXT;
    column_name_var TEXT;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    all_tables TEXT[] := ARRAY[
        'connections',
        'sync_jobs',
        'sync_logs',
        'security_events',
        'security_alerts',
        'ping_logs',
        'user_sessions',
        'usage_limits',
        'usage_history',
        'user_settings'
    ];
    connections_columns TEXT[] := ARRAY[
        'id', 'user_id', 'name', 'encrypted_url', 'environment', 
        'keep_alive', 'last_pinged_at', 'created_at', 'updated_at'
    ];
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database Schema Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Check each table
    FOREACH table_name_var IN ARRAY all_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name_var
        ) THEN
            RAISE NOTICE '✅ Table exists: %', table_name_var;
        ELSE
            RAISE NOTICE '❌ Table MISSING: %', table_name_var;
            missing_tables := array_append(missing_tables, table_name_var);
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking connections table columns...';
    RAISE NOTICE '========================================';
    
    -- Check connections table columns (especially keep_alive)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'connections'
    ) THEN
        FOREACH column_name_var IN ARRAY connections_columns
        LOOP
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'connections' 
                AND column_name = column_name_var
            ) THEN
                RAISE NOTICE '✅ Column exists: connections.%.', column_name_var;
            ELSE
                RAISE NOTICE '❌ Column MISSING: connections.%.', column_name_var;
                missing_columns := array_append(missing_columns, 'connections.' || column_name_var);
            END IF;
        END LOOP;
        
        -- Special check for keep_alive
        RAISE NOTICE '';
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'connections' 
            AND column_name = 'keep_alive'
        ) THEN
            RAISE NOTICE '✅ CRITICAL: keep_alive column EXISTS in connections table';
            RAISE NOTICE '   This should fix the error you were seeing.';
        ELSE
            RAISE NOTICE '❌ CRITICAL: keep_alive column is MISSING!';
            RAISE NOTICE '   This is causing your error.';
            RAISE NOTICE '   Run migration: 009_ensure_all_tables_and_columns.sql';
        END IF;
    ELSE
        RAISE NOTICE '❌ connections table does not exist!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary';
    RAISE NOTICE '========================================';
    
    IF array_length(missing_tables, 1) IS NULL AND array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ All tables and columns exist!';
        RAISE NOTICE '   Your database schema is complete.';
    ELSE
        RAISE NOTICE '❌ Missing items found:';
        IF array_length(missing_tables, 1) > 0 THEN
            RAISE NOTICE '   Missing tables: %', array_to_string(missing_tables, ', ');
        END IF;
        IF array_length(missing_columns, 1) > 0 THEN
            RAISE NOTICE '   Missing columns: %', array_to_string(missing_columns, ', ');
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE '📝 To fix, run this migration:';
        RAISE NOTICE '   supabase/migrations/009_ensure_all_tables_and_columns.sql';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Also show current connections table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'connections'
ORDER BY ordinal_position;

