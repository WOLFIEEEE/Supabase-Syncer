/**
 * Confirm User Email Script
 * 
 * Confirms a user's email using service role key (bypasses email confirmation requirement).
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/confirm-user-email.ts --email user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
try {
  config({ path: resolve(process.cwd(), '.env.local') });
} catch {}

const args = parseArgs({
  options: {
    email: { type: 'string', short: 'e', default: '' },
  },
});

async function confirmUserEmail() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }

  if (!serviceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
    console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
    process.exit(1);
  }

  const email = args.values.email;
  if (!email) {
    console.error('❌ Email is required');
    console.error('   Usage: SUPABASE_SERVICE_ROLE_KEY=key npx tsx scripts/confirm-user-email.ts --email user@example.com');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`📧 Confirming email for: ${email}`);
  console.log('');

  try {
    // First, get the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log('');
      console.log('💡 Create the user first:');
      console.log('   npx tsx scripts/create-test-user.ts --email ' + email);
      process.exit(1);
    }

    // Update user to confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
      }
    );

    if (updateError) {
      console.error('❌ Failed to confirm email:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Email confirmed successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   User ID: ${updatedUser.user.id}`);
    console.log(`   Email: ${updatedUser.user.email}`);
    console.log(`   Confirmed: ${updatedUser.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log('');
    console.log('💡 Now you can sign in:');
    console.log(`   npx tsx scripts/get-test-token.ts --email ${email}`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

confirmUserEmail();

