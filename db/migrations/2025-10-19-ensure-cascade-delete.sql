-- Migration: Ensure CASCADE DELETE constraints are properly set up
-- Date: 2025-10-19
-- Description: This migration ensures that when a quiz is deleted, all associated
--              questions and quiz_attempts are automatically deleted as well.
--              This also deletes the points earned by challengers from those attempts.

-- ============================================
-- STEP 1: Check current foreign key constraints
-- ============================================
-- Run this query to see existing constraints:
-- SELECT
--   tc.table_name, 
--   tc.constraint_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- JOIN information_schema.referential_constraints AS rc
--   ON tc.constraint_name = rc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name IN ('questions', 'quiz_attempts');

-- ============================================
-- STEP 2: Drop existing foreign key constraints if they exist
-- ============================================

-- Drop existing foreign key constraint on questions table
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS questions_quiz_id_fkey;

-- Drop existing foreign key constraint on quiz_attempts table
ALTER TABLE quiz_attempts 
DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey;

-- ============================================
-- STEP 3: Add new foreign key constraints with CASCADE DELETE
-- ============================================

-- Add CASCADE DELETE constraint for questions
-- When a quiz is deleted, all its questions are automatically deleted
ALTER TABLE questions
ADD CONSTRAINT questions_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES quizzes(id) 
ON DELETE CASCADE;

-- Add CASCADE DELETE constraint for quiz_attempts
-- When a quiz is deleted, all attempts (and their scores) are automatically deleted
ALTER TABLE quiz_attempts
ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES quizzes(id) 
ON DELETE CASCADE;

-- ============================================
-- STEP 4: Verify the constraints are set up correctly
-- ============================================

-- This query should show 'CASCADE' as the delete_rule for both tables
SELECT
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('questions', 'quiz_attempts')
  AND kcu.column_name = 'quiz_id';

-- ============================================
-- Expected Result:
-- ============================================
-- table_name     | constraint_name              | column_name | foreign_table_name | foreign_column_name | delete_rule
-- quiz_attempts  | quiz_attempts_quiz_id_fkey   | quiz_id     | quizzes            | id                  | CASCADE
-- questions      | questions_quiz_id_fkey       | quiz_id     | quizzes            | id                  | CASCADE

-- ============================================
-- IMPACT:
-- ============================================
-- After this migration, when a user deletes a quiz:
-- 1. All questions belonging to that quiz are automatically deleted
-- 2. All quiz_attempts for that quiz are automatically deleted
-- 3. All points earned by challengers from those attempts are removed
-- 4. The quiz history is completely cleared for all users
--
-- IMPORTANT: This is a destructive operation and cannot be undone!
--            Users should be warned when deleting a quiz that all
--            associated data will be permanently removed.

-- ============================================
-- HOW TO RUN THIS MIGRATION:
-- ============================================
-- 1. Log in to your Supabase Dashboard
-- 2. Navigate to: SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Run the migration
-- 6. Verify the output shows 'CASCADE' for both constraints
--
-- ROLLBACK (if needed):
-- To prevent cascade deletes, you would need to change the constraints to:
-- ON DELETE SET NULL or ON DELETE RESTRICT
-- But this is NOT recommended as it would leave orphaned records.
-- ============================================

SELECT 'Migration complete! CASCADE DELETE constraints are now enforced.' as status;
