/**
 * Database Schema Verification Script
 * 
 * Verifies that all required tables and columns exist in the database.
 * Run with: npx tsx scripts/verify-database-schema.ts
 */

import { createClient } from '@/lib/supabase/server';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableInfo {
  table_name: string;
  exists: boolean;
  columns: ColumnInfo[];
}

const REQUIRED_TABLES = [
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

const REQUIRED_COLUMNS = {
  connections: ['id', 'user_id', 'name', 'encrypted_url', 'environment', 'keep_alive', 'last_pinged_at', 'created_at', 'updated_at'],
  sync_jobs: ['id', 'user_id', 'source_connection_id', 'target_connection_id', 'direction', 'status', 'tables_config', 'created_at'],
  sync_logs: ['id', 'sync_job_id', 'level', 'message', 'created_at'],
  security_events: ['id', 'event_type', 'severity', 'user_id', 'created_at'],
  security_alerts: ['id', 'alert_type', 'severity', 'user_id', 'created_at'],
  ping_logs: ['id', 'connection_id', 'success', 'duration_ms', 'created_at'],
  user_sessions: ['id', 'user_id', 'session_token', 'created_at'],
  usage_limits: ['id', 'user_id', 'max_connections', 'created_at'],
  usage_history: ['id', 'user_id', 'period_start', 'created_at'],
  user_settings: ['id', 'user_id', 'settings', 'created_at']
};

async function verifySchema() {
  console.log('🔍 Starting database schema verification...\n');
  
  try {
    const supabase = await createClient();
    
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      // Fallback: query directly using raw SQL
      console.log('⚠️  Could not use RPC, trying alternative method...\n');
    }
    
    const results: Record<string, TableInfo> = {};
    let allPassed = true;
    
    // Check each required table
    for (const tableName of REQUIRED_TABLES) {
      console.log(`📋 Checking table: ${tableName}`);
      
      // Check if table exists by trying to query it
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      const tableExists = !error || !error.message.includes('does not exist');
      
      if (!tableExists) {
        console.error(`  ❌ Table '${tableName}' does NOT exist!`);
        allPassed = false;
        results[tableName] = {
          table_name: tableName,
          exists: false,
          columns: []
        };
        continue;
      }
      
      console.log(`  ✅ Table '${tableName}' exists`);
      
      // Get columns for this table
      const { data: columns, error: columnsError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              column_name, 
              data_type, 
              is_nullable, 
              column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });
      
      const tableColumns: ColumnInfo[] = columns || [];
      const requiredColumns = REQUIRED_COLUMNS[tableName as keyof typeof REQUIRED_COLUMNS] || [];
      
      // Check required columns
      const missingColumns: string[] = [];
      for (const requiredCol of requiredColumns) {
        const exists = tableColumns.some(col => col.column_name === requiredCol);
        if (!exists) {
          missingColumns.push(requiredCol);
          allPassed = false;
        }
      }
      
      if (missingColumns.length > 0) {
        console.error(`  ❌ Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log(`  ✅ All required columns exist (${requiredColumns.length} columns)`);
      }
      
      results[tableName] = {
        table_name: tableName,
        exists: true,
        columns: tableColumns
      };
    }
    
    // Special check for keep_alive column
    console.log('\n🔍 Special check: keep_alive column in connections table');
    const connectionsInfo = results['connections'];
    if (connectionsInfo?.exists) {
      const keepAliveColumn = connectionsInfo.columns.find(col => col.column_name === 'keep_alive');
      if (keepAliveColumn) {
        console.log('  ✅ keep_alive column exists');
        console.log(`     Type: ${keepAliveColumn.data_type}`);
        console.log(`     Nullable: ${keepAliveColumn.is_nullable}`);
        console.log(`     Default: ${keepAliveColumn.column_default || 'NULL'}`);
      } else {
        console.error('  ❌ keep_alive column is MISSING!');
        console.error('     This is the column causing the error.');
        console.error('     Please run: supabase/migrations/009_ensure_all_tables_and_columns.sql');
        allPassed = false;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ All tables and columns verified successfully!');
    } else {
      console.log('❌ Some tables or columns are missing!');
      console.log('\n📝 To fix, run this migration in Supabase SQL Editor:');
      console.log('   supabase/migrations/009_ensure_all_tables_and_columns.sql');
    }
    console.log('='.repeat(60));
    
    return allPassed;
  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    throw error;
  }
}

// Run verification
verifySchema()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

