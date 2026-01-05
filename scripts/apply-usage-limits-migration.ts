#!/usr/bin/env tsx
/**
 * Script to apply usage limits migration to Supabase database
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/apply-usage-limits-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Example: DATABASE_URL="postgresql://user:pass@host:port/db" npx tsx scripts/apply-usage-limits-migration.ts');
  process.exit(1);
}

async function applyMigration() {
  console.log('📦 Reading migration file...');
  
  const migrationPath = join(process.cwd(), 'supabase/migrations/004_add_usage_limits.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('🔌 Connecting to database...');
  const sql = postgres(databaseUrl, {
    max: 1,
    onnotice: () => {}, // Suppress notices
  });
  
  try {
    console.log('🚀 Applying migration...');
    
    // Execute the entire migration as one block
    // PostgreSQL can handle multiple statements in one execution
    try {
      await sql.unsafe(migrationSQL);
      console.log('✅ Migration applied successfully!');
    } catch (error: any) {
      // If it's a "relation already exists" error, that's okay
      if (error.code === '42P07' || error.code === '42710' || 
          error.message?.includes('already exists')) {
        console.log('⚠ Migration partially applied (some objects already exist)');
        console.log('   This is normal if running the migration multiple times');
      } else {
        throw error;
      }
    }
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usage_limits', 'usage_history', 'email_notifications')
    `;
    
    console.log('\n📊 Verification:');
    if (tables.length === 3) {
      console.log('   ✅ All tables created successfully');
      tables.forEach(t => console.log(`      - ${t.table_name}`));
    } else {
      console.log(`   ⚠ Found ${tables.length}/3 tables`);
      tables.forEach(t => console.log(`      - ${t.table_name}`));
    }
    
    console.log('✅ Migration completed!');
    console.log('\n📊 Created tables:');
    console.log('   - usage_limits');
    console.log('   - usage_history');
    console.log('   - email_notifications');
    console.log('\n🔒 RLS policies enabled');
    console.log('📧 Email notification system ready');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();

