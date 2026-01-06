/**
 * Script to apply the usage_limits INSERT policy migration
 * Run with: npx tsx scripts/apply-usage-limits-insert-policy.ts
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function applyMigration() {
  const sql = postgres(databaseUrl);
  
  try {
    console.log('📄 Reading migration file...');
    const migrationPath = join(process.cwd(), 'supabase/migrations/005_add_usage_limits_insert_policy.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        try {
          await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error: any) {
          // If policy already exists, that's okay
          if (error?.message?.includes('already exists') || error?.code === '42P07') {
            console.log(`⚠️  Statement ${i + 1} - Policy already exists, skipping`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('\n✅ Migration applied successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Added INSERT policy for usage_limits');
    console.log('   - Added INSERT policy for email_notifications');
    console.log('   - Added INSERT policy for usage_history');
    
  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();

