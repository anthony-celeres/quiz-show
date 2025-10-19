-- Migration: Convert admin/student roles to unified "challenger" role
-- Date: 2025-10-19
-- Description: Removes role-based access control and makes all users "challengers" who can both create and take quizzes

-- Step 1: First, drop the existing CHECK constraint to allow updates
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Step 2: Update existing user roles to "challenger"
UPDATE user_roles 
SET role = 'challenger' 
WHERE role IN ('admin', 'student');

-- Step 3: Update any remaining user_roles with other values
UPDATE user_roles 
SET role = 'challenger' 
WHERE role IS NOT NULL AND role != 'challenger';

-- Step 4: Update auth.users metadata to set role as "challenger"
-- Note: This updates the user_metadata JSONB field
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"challenger"'::jsonb
)
WHERE raw_user_meta_data->>'role' IN ('admin', 'student');

-- Step 5: Also handle users with no role set
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"challenger"'::jsonb
)
WHERE raw_user_meta_data->>'role' IS NULL 
   OR raw_user_meta_data->>'role' = '';

-- Step 6: Handle auth.users with any other role values
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"challenger"'::jsonb
)
WHERE raw_user_meta_data->>'role' IS NOT NULL 
  AND raw_user_meta_data->>'role' != '' 
  AND raw_user_meta_data->>'role' != 'challenger';

-- Step 7: Now add the CHECK constraint after all data is updated
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role = 'challenger');

-- Step 8: Add visibility column to quizzes table
-- This allows challengers to control who can take their quizzes
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- Update existing quizzes to be public by default
UPDATE quizzes 
SET visibility = 'public' 
WHERE visibility IS NULL;

-- Step 8b: Add max_attempts column to quizzes table
-- This allows challengers to control how many times a user can take the quiz
-- NULL or 0 means unlimited attempts, positive number limits attempts
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT NULL CHECK (max_attempts IS NULL OR max_attempts >= 0);

-- Update existing quizzes to allow unlimited attempts by default
UPDATE quizzes 
SET max_attempts = NULL 
WHERE max_attempts IS NULL;

-- Step 9: Update Row Level Security policies for quizzes
-- Remove admin-only restrictions and allow all authenticated users to manage quizzes

DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone can view active quizzes" ON quizzes;

-- New policy: All authenticated users (challengers) can create quizzes
CREATE POLICY "Challengers can create quizzes" ON quizzes
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- New policy: Users can update their own quizzes
CREATE POLICY "Challengers can update own quizzes" ON quizzes
  FOR UPDATE 
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- New policy: Users can delete their own quizzes
CREATE POLICY "Challengers can delete own quizzes" ON quizzes
  FOR DELETE 
  USING (auth.uid() = created_by);

-- New policy: All authenticated users can view quizzes (active or not)
-- Respect visibility: public quizzes visible to all, private only to creator
CREATE POLICY "Challengers can view quizzes based on visibility" ON quizzes
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND (
      visibility = 'public' 
      OR created_by = auth.uid()
    )
  );

-- Step 10: Update Row Level Security policies for questions
-- Remove admin-only restrictions

DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
DROP POLICY IF EXISTS "Anyone can view questions for active quizzes" ON questions;

-- New policy: Users can manage questions for their own quizzes
CREATE POLICY "Challengers can manage own quiz questions" ON questions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

-- New policy: All authenticated users can view questions
-- Respect quiz visibility: public quiz questions visible to all, private only to quiz creator
CREATE POLICY "Challengers can view questions based on quiz visibility" ON questions
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND (
        quizzes.visibility = 'public' 
        OR quizzes.created_by = auth.uid()
      )
    )
  );

-- Step 11: Update Row Level Security policies for quiz_attempts
-- Allow users to create attempts for public quizzes or their own private quizzes
DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can create attempts" ON quiz_attempts;

-- New policy: Users can create attempts for accessible quizzes
CREATE POLICY "Challengers can create attempts for accessible quizzes" ON quiz_attempts
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_attempts.quiz_id 
      AND quizzes.is_active = true
      AND (
        quizzes.visibility = 'public' 
        OR quizzes.created_by = auth.uid()
      )
    )
  );

-- New policy: Users can view their own attempts or attempts on their quizzes
CREATE POLICY "Challengers can view own attempts or attempts on own quizzes" ON quiz_attempts
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_attempts.quiz_id 
      AND quizzes.created_by = auth.uid()
    )
  );

-- Step 12: Verify the migration
SELECT 'Migration complete!' as status;
SELECT COUNT(*) as total_challengers FROM user_roles WHERE role = 'challenger';
SELECT COUNT(*) as total_users_with_challenger_role FROM auth.users WHERE raw_user_meta_data->>'role' = 'challenger';
SELECT COUNT(*) as total_public_quizzes FROM quizzes WHERE visibility = 'public';
SELECT COUNT(*) as total_private_quizzes FROM quizzes WHERE visibility = 'private';

-- ============================================
-- HOW TO RUN THIS MIGRATION:
-- ============================================
-- 1. Log in to your Supabase Dashboard
-- 2. Navigate to: SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Run the migration
-- 6. Verify the output shows successful migration
--
-- ROLLBACK (if needed):
-- There is no automated rollback for this migration.
-- If you need to restore admin/student roles, you'll need to:
-- 1. Manually identify which users should be admins vs students
-- 2. Update user_roles and auth.users accordingly
-- 3. Restore the original RLS policies
-- ============================================
