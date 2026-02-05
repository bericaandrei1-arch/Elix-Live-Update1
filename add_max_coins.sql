-- Add Maximum Coins to Your Account
-- Run this SQL in your Supabase SQL Editor

-- Option 1: If you're using Supabase Auth (profiles table)
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles
SET coin_balance = 999999999
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);

-- Option 2: If you're using custom users table
-- Replace 'your-email@example.com' with your actual email
UPDATE users
SET coin_balance = 999999999
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT email, coin_balance FROM users WHERE email = 'your-email@example.com';
SELECT u.email, p.coin_balance 
FROM auth.users u 
JOIN public.profiles p ON p.user_id = u.id 
WHERE u.email = 'your-email@example.com';
