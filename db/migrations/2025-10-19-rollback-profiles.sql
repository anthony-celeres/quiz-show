-- Rollback Script for User Profiles Migration
-- Run this if you need to clean up before re-running the migration

-- Drop views first (depend on tables)
DROP VIEW IF EXISTS public.quiz_attempts_with_profiles;
DROP VIEW IF EXISTS public.quizzes_with_creators;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop table (will cascade delete all profiles)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Verification
SELECT 'Cleanup complete. You can now run the migration again.' as status;
