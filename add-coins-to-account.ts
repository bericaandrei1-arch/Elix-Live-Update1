/**
 * Add Maximum Coins to Account - Development Tool
 * 
 * Run with: npx tsx add-coins-to-account.ts
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_COINS = 999999999; // ~1 billion coins

async function addMaxCoins(email: string) {
  console.log(`\n🪙 Adding maximum coins to account: ${email}\n`);

  // Method 1: Update profiles table (Supabase Auth)
  const { data: authUser, error: authError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();

  if (!authError && authUser) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ coin_balance: MAX_COINS })
      .eq('user_id', authUser.id);

    if (profileError) {
      console.error('❌ Error updating profiles:', profileError.message);
    } else {
      console.log(`✅ Updated profiles table: ${MAX_COINS.toLocaleString()} coins added`);
    }
  }

  // Method 2: Update users table (custom auth)
  const { error: usersError } = await supabase
    .from('users')
    .update({ coin_balance: MAX_COINS })
    .eq('email', email);

  if (usersError) {
    console.error('❌ Error updating users:', usersError.message);
  } else {
    console.log(`✅ Updated users table: ${MAX_COINS.toLocaleString()} coins added`);
  }

  // Verify the update
  console.log('\n📊 Verification:\n');

  const { data: userData } = await supabase
    .from('users')
    .select('email, coin_balance')
    .eq('email', email)
    .single();

  if (userData) {
    console.log(`Users table: ${userData.coin_balance?.toLocaleString() || 0} coins`);
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('coin_balance, user_id')
    .eq('user_id', authUser?.id)
    .single();

  if (profileData) {
    console.log(`Profiles table: ${profileData.coin_balance?.toLocaleString() || 0} coins`);
  }

  console.log('\n✅ Done! Refresh your app to see the updated balance.\n');
}

// Get email from command line argument or use default
const userEmail = process.argv[2] || 'test@example.com';

addMaxCoins(userEmail).catch(console.error);
