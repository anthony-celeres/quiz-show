# Cascade Delete Feature

## Overview
When a user deletes a quiz, all associated data is automatically removed from the database, including:
- All questions belonging to the quiz
- All quiz attempts (history) from all users
- All points earned by challengers from those attempts

This ensures data integrity and prevents orphaned records in the database.

## How It Works

### Database Level (Automatic)
The cascade delete is handled at the database level through PostgreSQL foreign key constraints with `ON DELETE CASCADE`:

```sql
-- Questions table
ALTER TABLE questions
ADD CONSTRAINT questions_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES quizzes(id) 
ON DELETE CASCADE;

-- Quiz Attempts table
ALTER TABLE quiz_attempts
ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES quizzes(id) 
ON DELETE CASCADE;
```

When a quiz is deleted from the `quizzes` table:
1. PostgreSQL automatically finds all rows in `questions` where `quiz_id` matches the deleted quiz
2. PostgreSQL automatically finds all rows in `quiz_attempts` where `quiz_id` matches the deleted quiz
3. All matching rows are deleted automatically
4. The operation is atomic - either everything succeeds or nothing changes

### Application Level (User Experience)
The delete operation is triggered from the challenger dashboard:

**File**: `app/challenger/quizzes/page.client.tsx`
```typescript
const handleDeleteQuiz = async (quizId: string) => {
  if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
    return;
  }
  // Calls DELETE API endpoint
  const response = await fetch(`/api/quizzes/${quizId}`, {
    method: 'DELETE',
  });
};
```

**File**: `app/api/quizzes/[quizId]/route.ts`
```typescript
export async function DELETE(_request: Request, context: { params: Promise<{ quizId: string }> }) {
  // 1. Verify user is authenticated
  // 2. Verify user owns the quiz
  // 3. Delete the quiz (cascade automatically deletes questions and attempts)
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
}
```

## What Gets Deleted

When you delete a quiz with ID `quiz-123`:

### 1. Questions Table
All questions for the quiz are deleted:
```sql
-- Automatically executed by PostgreSQL
DELETE FROM questions WHERE quiz_id = 'quiz-123';
```

### 2. Quiz Attempts Table
All attempts for the quiz are deleted:
```sql
-- Automatically executed by PostgreSQL
DELETE FROM quiz_attempts WHERE quiz_id = 'quiz-123';
```

This includes:
- User scores
- Answers submitted
- Time taken
- Completion timestamps
- All other attempt data

### 3. User Points
Since `quiz_attempts` records contain the `score` field, when these records are deleted:
- The points earned by users from this quiz are removed
- Users' total scores across all quizzes are recalculated (when viewing leaderboard/profile)
- History pages will no longer show the deleted quiz

## Impact on Users

### Quiz Creator (Person who deletes the quiz)
- ✅ Quiz is removed from their created quizzes list
- ✅ All questions are removed
- ✅ All attempt history is removed
- ✅ Cannot be undone

### Quiz Takers (Challengers who took the quiz)
- ✅ Quiz is removed from their available quizzes list
- ✅ Quiz is removed from their history
- ✅ Points earned from the quiz are removed
- ✅ Leaderboard rankings are recalculated without these points
- ✅ Cannot access the quiz results anymore

## User Warnings

### Confirmation Dialog
Before deletion, users see a confirmation dialog:

```
Are you sure you want to delete this quiz? This action cannot be undone.
```

**Considerations for Enhancement:**
You may want to add more detailed warnings, such as:

```
⚠️ WARNING: Deleting this quiz will:
• Permanently delete all [X] questions
• Remove [Y] user attempts and their scores
• Delete all history and points earned from this quiz
• This action CANNOT be undone

Are you absolutely sure you want to continue?
```

## Security

### Row Level Security (RLS)
Only the quiz creator can delete a quiz:

**File**: `app/api/quizzes/[quizId]/route.ts`
```typescript
// Ensure the authenticated user is the creator of the quiz
const ownerCheck = await supabase.from('quizzes').select('created_by').eq('id', quizId).maybeSingle();
if (!ownerCheck.data || ownerCheck.data.created_by !== user.id) {
  return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
}
```

**Database Policy**:
```sql
CREATE POLICY "Challengers can delete own quizzes" ON quizzes
  FOR DELETE 
  USING (auth.uid() = created_by);
```

## Migration

To ensure the cascade delete constraints are properly set up:

1. Navigate to Supabase Dashboard → SQL Editor
2. Run the migration script: `db/migrations/2025-10-19-ensure-cascade-delete.sql`
3. Verify the output shows `CASCADE` for both constraints

## Verification

### Test the Feature
1. Create a test quiz with multiple questions
2. Have another user take the quiz (create attempts)
3. Check the leaderboard/history - you should see the attempts
4. Delete the quiz as the creator
5. Verify:
   - Quiz is removed from quizzes list
   - Questions are deleted (check database)
   - Attempts are deleted (check history page)
   - Points are removed from leaderboard

### Check Database Constraints
Run this query in Supabase SQL Editor:

```sql
SELECT
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('questions', 'quiz_attempts')
  AND kcu.column_name = 'quiz_id';
```

Expected result should show `delete_rule = 'CASCADE'` for both tables.

## Benefits

1. **Data Integrity**: No orphaned records in the database
2. **Privacy**: User data is properly cleaned up when content is removed
3. **Automatic**: No manual cleanup required
4. **Atomic**: Either all data is deleted or none (transaction safety)
5. **Performance**: Database handles cascading efficiently

## Limitations

1. **No Soft Delete**: Once deleted, data cannot be recovered
2. **No Archive**: Deleted quizzes are not archived for later restoration
3. **Immediate Impact**: All users lose access immediately

## Future Enhancements

### Potential Improvements:
1. **Soft Delete**: Instead of permanent deletion, mark quizzes as "deleted" and hide them
2. **Archive Feature**: Move deleted quizzes to an archive table for 30 days before permanent deletion
3. **Restore Option**: Allow quiz creators to restore recently deleted quizzes
4. **Backup Notification**: Email quiz creator a backup of their quiz data before deletion
5. **Deletion Impact Report**: Show the quiz creator how many users will be affected before deletion
6. **Bulk Operations**: Allow deleting multiple quizzes at once with a summary of impact

## Related Files

- `db/migrations/2025-10-19-ensure-cascade-delete.sql` - Migration script
- `app/api/quizzes/[quizId]/route.ts` - DELETE API endpoint
- `app/challenger/quizzes/page.client.tsx` - Delete button UI
- `docs/EDIT_DELETE_FEATURES.md` - Original delete feature documentation

## Summary

The cascade delete feature ensures that when a quiz is deleted, all related data is automatically and permanently removed. This is handled efficiently at the database level through PostgreSQL foreign key constraints, ensuring data integrity and preventing orphaned records. Users are warned before deletion, but the operation cannot be undone.
