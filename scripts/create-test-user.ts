/**
 * Create Test User Script
 * 
 * Creates a test user in Supabase for development/testing purposes.
 * 
 * Usage:
 *   npx tsx scripts/create-test-user.ts
 *   npx tsx scripts/create-test-user.ts --email test@example.com --password testpass123
 */

import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

const args = parseArgs({
  options: {
    email: { type: 'string', short: 'e', default: 'test@example.com' },
    password: { type: 'string', short: 'p', default: 'TestPassword123!' },
    service: { type: 'string', short: 's', default: 'anon' },
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

async function createTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }

  // Use service role key if available (can create users without email confirmation)
  // Otherwise use anon key (requires email confirmation)
  const key = args.values.service === 'service' && serviceKey ? serviceKey : anonKey;

  if (!key) {
    console.error('❌ Supabase key is not set');
    if (args.values.service === 'service') {
      console.error('   Set SUPABASE_SERVICE_ROLE_KEY for service role access');
    } else {
      console.error('   Set NEXT_PUBLIC_SUPABASE_ANON_KEY for anon access');
    }
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = args.values.email || 'test@example.com';
  const password = args.values.password || 'TestPassword123!';

  console.log('📝 Creating test user...');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log('');

  try {
    // If using service role, create user directly with admin API
    if (args.values.service === 'service' && serviceKey) {
      console.log('Using service role to create confirmed user...');
      
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

      if (error) {
        console.error('❌ Failed to create user:', error.message);
        process.exit(1);
      }

      if (!data.user) {
        console.error('❌ User creation failed: No user data returned');
        process.exit(1);
      }

      console.log('✅ Test user created and confirmed!');
      console.log('');
      console.log('📋 User Details:');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('');
      console.log('💡 Now you can sign in with:');
      console.log(`   npx tsx scripts/get-test-token.ts --email ${email} --password ${password}`);
      return;
    }

    // Try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      // If user already exists, try to sign in
      if (error.message.includes('already registered')) {
        console.log('⚠️  User already exists. Attempting to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('❌ Failed to sign in:', signInError.message);
          console.log('');
          console.log('💡 Try resetting the password or use a different email.');
          process.exit(1);
        }

        console.log('✅ Successfully signed in existing user');
        console.log('');
        console.log('📋 User Details:');
        console.log(`   User ID: ${signInData.user?.id}`);
        console.log(`   Email: ${signInData.user?.email}`);
        console.log(`   Access Token: ${signInData.session?.access_token?.substring(0, 20)}...`);
        console.log('');
        console.log('🔑 To use this token for testing:');
        console.log(`   export TEST_USER_TOKEN="${signInData.session?.access_token}"`);
        return;
      }

      console.error('❌ Failed to create user:', error.message);
      process.exit(1);
    }

    if (!data.user) {
      console.error('❌ User creation failed: No user data returned');
      process.exit(1);
    }

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    
    if (data.session) {
      console.log(`   Access Token: ${data.session.access_token.substring(0, 20)}...`);
      console.log('');
      console.log('🔑 To use this token for testing:');
      console.log(`   export TEST_USER_TOKEN="${data.session.access_token}"`);
    } else {
      console.log('');
      console.log('⚠️  No session created. This might require email confirmation.');
      console.log('   Check your Supabase dashboard for email confirmation settings.');
      console.log('');
      console.log('💡 Alternative: Use service role key to create users without email confirmation:');
      console.log('   SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/create-test-user.ts --service service');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createTestUser();

