/**
 * Script to generate a bcrypt password hash
 * 
 * Usage: npx tsx scripts/generate-password-hash.ts "your-password"
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npx tsx scripts/generate-password-hash.ts "your-password"');
  process.exit(1);
}

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('\nPassword Hash Generated Successfully!\n');
  console.log('Add this to your .env file:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\n');
}

main().catch(console.error);




