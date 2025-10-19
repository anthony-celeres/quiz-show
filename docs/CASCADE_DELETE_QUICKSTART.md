# CASCADE DELETE - Quick Reference

## What Happens When You Delete a Quiz?

When a quiz is deleted, the following data is **automatically and permanently** removed:

### ✅ Deleted Automatically:
1. **The quiz itself** - Removed from all lists
2. **All questions** - Every question in the quiz
3. **All attempts** - Every user's attempt history
4. **All scores** - Points earned by users from this quiz
5. **All answers** - User responses to quiz questions

### ❌ NOT Deleted:
- User accounts
- Other quizzes
- Attempts from other quizzes

## How to Set Up

### 1. Run the Migration
```bash
# In Supabase Dashboard → SQL Editor
# Copy and run: db/migrations/2025-10-19-ensure-cascade-delete.sql
```

### 2. Verify Setup
```sql
-- Run this in SQL Editor to verify CASCADE is enabled
SELECT
  tc.table_name, 
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('questions', 'quiz_attempts')
  AND tc.constraint_type = 'FOREIGN KEY';

-- Expected: delete_rule = 'CASCADE' for both tables
```

## User Experience

### Before (Simple Confirmation)
```
Are you sure you want to delete this quiz? This action cannot be undone.
```

### After (Detailed Warning)
```
⚠️ WARNING: This will permanently delete:

• All questions in this quiz
• All user attempts and scores
• All history and points earned from this quiz

This action CANNOT be undone!

Are you sure you want to continue?
```

## Testing

### Quick Test:
1. Create a test quiz with 3 questions
2. Take the quiz (or have another user take it)
3. Check history - you should see the attempt
4. Delete the quiz
5. Check history - attempt should be gone
6. Check leaderboard - points should be removed

### Database Test:
```sql
-- Before deletion: Count records
SELECT 
  (SELECT COUNT(*) FROM questions WHERE quiz_id = 'YOUR_QUIZ_ID') as question_count,
  (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = 'YOUR_QUIZ_ID') as attempt_count;

-- Delete the quiz via UI or API

-- After deletion: Verify counts are 0
SELECT 
  (SELECT COUNT(*) FROM questions WHERE quiz_id = 'YOUR_QUIZ_ID') as question_count,
  (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = 'YOUR_QUIZ_ID') as attempt_count;
```

## Files Changed

| File | Change |
|------|--------|
| `db/migrations/2025-10-19-ensure-cascade-delete.sql` | **NEW** - Migration to ensure CASCADE constraints |
| `docs/CASCADE_DELETE_FEATURE.md` | **NEW** - Complete documentation |
| `docs/CASCADE_DELETE_QUICKSTART.md` | **NEW** - This quick reference |
| `app/challenger/quizzes/page.client.tsx` | **UPDATED** - Enhanced delete confirmation message |

## Summary

✅ **What you asked for**: "When a user delete a quiz, all history that was recorded from the quiz will be deleted also, including the points earned by the challenger from that deleted quiz will be gone"

✅ **What's implemented**: 
- Database CASCADE constraints ensure automatic deletion
- Enhanced warning message informs users of the impact
- Secure (only quiz creator can delete)
- Atomic operation (all or nothing)

✅ **Next steps**:
1. Run the migration in Supabase Dashboard
2. Test the feature with a test quiz
3. Verify CASCADE constraints are working

## Need Help?

See full documentation: `docs/CASCADE_DELETE_FEATURE.md`
