/**
 * Get Test Token Script
 * 
 * Signs in with test credentials and outputs the JWT token for testing.
 * 
 * Usage:
 *   npx tsx scripts/get-test-token.ts
 *   npx tsx scripts/get-test-token.ts --email test@example.com --password testpass123
 */

import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

const args = parseArgs({
  options: {
    email: { type: 'string', short: 'e', default: 'test@example.com' },
    password: { type: 'string', short: 'p', default: 'TestPassword123!' },
  },
});

// Load environment variables from .env.local if available
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load .env.local
try {
  config({ path: resolve(process.cwd(), '.env.local') });
} catch {
  // Ignore if .env.local doesn't exist
}

async function getTestToken() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = args.values.email || 'test@example.com';
  const password = args.values.password || 'TestPassword123!';

  console.log('🔐 Signing in...');
  console.log(`   Email: ${email}`);
  console.log('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in failed:', error.message);
      console.log('');
      console.log('💡 Make sure the user exists. Create one with:');
      console.log('   npx tsx scripts/create-test-user.ts');
      process.exit(1);
    }

    if (!data.session) {
      console.error('❌ No session created');
      process.exit(1);
    }

    console.log('✅ Successfully signed in!');
    console.log('');
    console.log('📋 Token Information:');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Token (first 50 chars): ${data.session.access_token.substring(0, 50)}...`);
    console.log('');
    console.log('🔑 Full Access Token:');
    console.log(data.session.access_token);
    console.log('');
    console.log('💡 Use this token for testing:');
    console.log(`   export TEST_USER_TOKEN="${data.session.access_token}"`);
    console.log('');
    console.log('📝 Or use in curl:');
    console.log(`   curl -H "Authorization: Bearer ${data.session.access_token.substring(0, 50)}..." ...`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

getTestToken();

