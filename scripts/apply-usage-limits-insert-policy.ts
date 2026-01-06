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
    
    // Remove comments and split by semicolon
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');
    
    // Split by semicolon, but keep CREATE POLICY statements together
    const statements: string[] = [];
    let currentStatement = '';
    const lines = cleanedSQL.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      currentStatement += (currentStatement ? '\n' : '') + line;
      
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.length > 0) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 80)}...`);
        try {
          await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error: any) {
          // If policy already exists, that's okay
          if (error?.message?.includes('already exists') || 
              error?.code === '42P07' || 
              error?.code === '42710' ||
              error?.message?.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} - Policy already exists, skipping`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
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

