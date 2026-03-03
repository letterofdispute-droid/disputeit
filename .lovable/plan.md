

# Fix: Missing UNIQUE Constraint on `profiles.user_id`

## The Problem

The error `there is no unique constraint matching given keys for referenced table "profiles"` occurs because:

1. Line 114 of the migration SQL has: `author_id uuid REFERENCES public.profiles(user_id)`
2. But the `profiles` table definition (lines 25-42) doesn't declare `user_id` as `UNIQUE`
3. In the live database, `profiles.user_id` has a unique index (`profiles_user_id_key`), but I forgot to include it in the generated SQL

## The Fix

One line change in `.lovable/migration-schema.sql`, line 27:

**Before:**
```sql
user_id uuid NOT NULL,
```

**After:**
```sql
user_id uuid NOT NULL UNIQUE,
```

Additionally, I also need to add the `role` column default which is `'user'` in the live DB but missing, and the `subscription_status` default which is `'none'` in live but omitted. Let me also add the missing indexes that exist in the live database:

- `idx_profiles_user_id` (redundant with UNIQUE but matches live)
- `idx_profiles_is_admin`

## What to do

After I make this fix, re-copy the updated SQL and run it again in your new Supabase SQL editor. If you already created some tables from the first run, you'll need to either drop them first (`DROP TABLE IF EXISTS ... CASCADE`) or start fresh with a new project.

