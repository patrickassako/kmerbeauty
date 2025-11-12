# Supabase Migration Guide

## Critical Fix: Add Users INSERT Policy

### Problem
The users table had Row Level Security (RLS) enabled but was missing an INSERT policy. This prevented user registration from working.

### Solution

You need to apply the migration `001_add_users_insert_policy.sql` to your Supabase database.

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `backend/supabase/migrations/001_add_users_insert_policy.sql`
4. Copy its contents
5. Paste into the SQL Editor
6. Click **Run**

### Option 2: Using Supabase CLI

```bash
cd backend
supabase db push
```

## Verify the Migration

After applying the migration, verify it worked:

1. Go to **Authentication** > **Policies** in Supabase Dashboard
2. Click on the `users` table
3. You should see THREE policies:
   - `users_select_own` (SELECT)
   - `users_insert_own` (INSERT) ✅ NEW
   - `users_update_own` (UPDATE)

## Environment Variables

Make sure your `backend/.env` file has these Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Where to find these values:

1. **SUPABASE_URL**:
   - Go to Project Settings > API
   - Copy "Project URL"

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - Go to Project Settings > API
   - Copy "service_role" key (⚠️ Keep this secret! Never commit to git!)
   - This key bypasses RLS and should only be used server-side

## Test the Fix

After applying the migration and updating your .env:

1. Restart your backend: `npm run start:dev`
2. Try to create a new account in the mobile app
3. Check the backend console logs - you should see detailed logging:
   ```
   🔵 [SignUp] Starting signup process for: user@example.com
   🔵 [SignUp] Creating auth user...
   ✅ [SignUp] Auth user created: <uuid>
   🔵 [SignUp] Session status: Session created
   🔵 [SignUp] Inserting user into database...
   ✅ [SignUp] User inserted into database successfully
   ✅ [SignUp] Signup completed successfully
   ```

4. Verify in Supabase Dashboard:
   - Go to **Authentication** > **Users** - should see the user
   - Go to **Database** > **users** table - should see the user record

## Common Issues

### Issue: "Email confirmation required"
If you see: `⚠️ [SignUp] No session - email confirmation may be required`

**Solution**: Disable email confirmation for development:
1. Go to **Authentication** > **Settings**
2. Uncheck "Enable email confirmations"

### Issue: Still getting "erreur lors de la création du profil"
Check the backend logs for the actual error:
```
🔴 [SignUp] Database insert failed: <actual error>
🔴 [SignUp] Error details: <full error JSON>
```

The detailed error will tell you exactly what's wrong (field mismatch, constraint violation, etc.)

### Issue: "SUPABASE_URL and Service Role Key must be provided"
Your `.env` file is missing the Supabase credentials. See "Environment Variables" section above.
