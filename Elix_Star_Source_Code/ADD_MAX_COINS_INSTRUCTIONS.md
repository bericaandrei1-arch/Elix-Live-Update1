# 🪙 Add Maximum Coins to Your Account

## Method 1: Using Supabase SQL Editor (Easiest)

1. **Go to Supabase Dashboard:** https://app.supabase.com
2. **Select your project**
3. **Click "SQL Editor"** in the left sidebar
4. **Copy and paste this SQL:**

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles
SET coin_balance = 999999999
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);

-- Also update users table if you're using custom auth
UPDATE users
SET coin_balance = 999999999
WHERE email = 'your-email@example.com';
```

5. **Replace `'your-email@example.com'`** with your actual email
6. **Click "Run"** (or press Ctrl+Enter)
7. **Refresh your app** - you should now have 999,999,999 coins!

---

## Method 2: Using the Script (Requires .env setup)

1. **Make sure your `.env` file has:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the script:**
   ```bash
   npx tsx add-coins-to-account.ts your-email@example.com
   ```

3. **Refresh your app** to see the balance

---

## Method 3: Direct SQL File

1. **Open `add_max_coins.sql`**
2. **Replace `'your-email@example.com'`** with your email
3. **Copy the entire SQL**
4. **Paste into Supabase SQL Editor**
5. **Run it**

---

## Verification

After running any method, verify your coins:

**In Supabase SQL Editor:**
```sql
-- Check profiles table
SELECT u.email, p.coin_balance 
FROM auth.users u 
JOIN public.profiles p ON p.user_id = u.id 
WHERE u.email = 'your-email@example.com';

-- Check users table
SELECT email, coin_balance 
FROM users 
WHERE email = 'your-email@example.com';
```

**In your app:**
1. Open the preview (http://localhost:5175/)
2. Login with your account
3. Click the Gift button
4. You should see: **🪙 999,999,999 coins**

---

## Troubleshooting

### "No rows updated"
- Make sure the email matches exactly (case-sensitive)
- Check if you're using `auth.users` (Supabase Auth) or `users` table (custom auth)
- Try both UPDATE statements

### "Permission denied"
- Make sure you're using the **Service Role Key** (not anon key) in the script
- Or use the **SQL Editor** in Supabase Dashboard (has full permissions)

### Coins not showing in app
- Hard refresh: **Ctrl + Shift + R**
- Close and reopen the gift panel
- Check browser console for errors
- Verify the coin balance in Supabase SQL Editor

---

## Quick Test

**Easiest way to test gifts right now:**

1. Go to Supabase SQL Editor
2. Paste this (replace email):
   ```sql
   UPDATE public.profiles SET coin_balance = 999999999 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```
3. Run it
4. Refresh your app
5. Test sending gifts!

---

**You'll have nearly 1 billion coins to test with!** 🎉
