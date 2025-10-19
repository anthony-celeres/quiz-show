# 🔧 Migration Fix - Step by Step

## The Problem
The username `aceleres.nimbus_b951` contains a period (`.`) which violates the constraint. The migration has been fixed to sanitize usernames by replacing invalid characters with underscores.

## Solution: Run These Steps

### Step 1: Clean Up (Rollback)
```sql
-- In Supabase SQL Editor, run this first:
-- Copy contents from: db/migrations/2025-10-19-rollback-profiles.sql
```

This will remove:
- ✅ The profiles table
- ✅ All triggers
- ✅ All functions
- ✅ All views

### Step 2: Run Fixed Migration
```sql
-- Now run the fixed migration:
-- Copy contents from: db/migrations/2025-10-19-add-user-profiles.sql
```

The migration now:
- ✅ Sanitizes usernames (replaces periods, spaces, etc. with underscores)
- ✅ Example: `aceleres.nimbus` → `aceleres_nimbus`
- ✅ Ensures minimum 3 characters
- ✅ Handles duplicate usernames gracefully

### Step 3: Verify
After running, you should see:
```
Total profiles created: [number]
Sample profiles: [list of usernames]
```

Check that usernames are properly formatted:
```sql
SELECT username, display_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC;
```

## Expected Results

Your username will be: `aceleres_nimbus_b951` (period replaced with underscore)

You can update it to any valid username at: `/challenger/profile`

## Valid Username Format
- ✅ Letters: `a-z`, `A-Z`
- ✅ Numbers: `0-9`
- ✅ Underscore: `_`
- ✅ Hyphen: `-`
- ❌ Periods, spaces, special characters

## Test After Migration

1. Login to your app
2. Visit: http://localhost:3000/challenger/profile
3. Update your username to something like: `aceleres-nimbus` or `aceleres_nimbus`
4. Create a quiz and verify your username appears
5. Check leaderboard

## Troubleshooting

### If you still see errors:
1. Make sure you ran the rollback script first
2. Refresh your Supabase connection
3. Check if there are any existing profiles with invalid characters
4. Run this query to find problematic usernames:
```sql
SELECT username 
FROM public.profiles 
WHERE username !~ '^[a-zA-Z0-9_-]+$';
```

### Need to manually fix a username?
```sql
UPDATE public.profiles 
SET username = regexp_replace(username, '[^a-zA-Z0-9_-]', '_', 'g')
WHERE id = 'your-user-id';
```

## All Good Now! 🎉
The migration is fixed and ready to run.
