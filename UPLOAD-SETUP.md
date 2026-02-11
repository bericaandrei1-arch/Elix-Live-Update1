# Video upload – make it work in 2 steps

## 1. Supabase SQL (once)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Open the file **`supabase-upload-setup.sql`** in this project.
4. Copy all its content into the SQL Editor and click **Run**.

## 2. Storage bucket (once)

1. In Supabase go to **Storage**.
2. Click **New bucket**.
3. Name: **user-content** (exactly, lowercase, with hyphen).
4. Leave it **Public** (or add policies as in the SQL).
5. Create the bucket.

## 3. Try posting

1. Restart the app (`npm run dev`).
2. Log in.
3. Open Upload, record or pick a video, tap **Post**.

If it still fails, the **red error box** on the Upload screen will show the reason (e.g. “Storage failed: …” or “Database: …”).
