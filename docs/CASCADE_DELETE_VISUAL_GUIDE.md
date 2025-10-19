# CASCADE DELETE - Visual Guide

## 📊 Database Relationship Diagram

```
┌─────────────────────┐
│      QUIZZES        │
│                     │
│  id (PRIMARY KEY)   │◄────┐
│  title              │     │
│  description        │     │
│  created_by         │     │
│  duration_minutes   │     │
│  is_active          │     │
└─────────────────────┘     │
                            │
                            │ ON DELETE CASCADE
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
        │                                        │
┌───────▼─────────┐                   ┌─────────▼──────────┐
│   QUESTIONS     │                   │   QUIZ_ATTEMPTS    │
│                 │                   │                    │
│  id             │                   │  id                │
│  quiz_id (FK)   │                   │  quiz_id (FK)      │
│  question_text  │                   │  user_id           │
│  options        │                   │  score             │
│  correct_answer │                   │  total_points      │
│  points         │                   │  answers           │
└─────────────────┘                   │  completed_at      │
                                      └────────────────────┘
```

## 🔄 Cascade Delete Flow

### Step 1: User Initiates Delete
```
┌──────────────────────────────────────┐
│  User clicks 🗑️ Delete Quiz button   │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Enhanced Warning Dialog Appears     │
│                                      │
│  ⚠️ WARNING: This will delete:       │
│  • All questions                     │
│  • All attempts                      │
│  • All points earned                 │
│                                      │
│  [Cancel]  [Confirm Delete]          │
└──────────────────┬───────────────────┘
                   │
                   ▼
```

### Step 2: Security Check
```
┌──────────────────────────────────────┐
│  API: DELETE /api/quizzes/:id        │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Is user authenticated?              │
│  └─ No → 401 Unauthorized           │
│  └─ Yes → Continue                   │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Does user own the quiz?             │
│  └─ No → 403 Forbidden              │
│  └─ Yes → Continue                   │
└──────────────────┬───────────────────┘
                   │
                   ▼
```

### Step 3: Database Cascade Delete
```
┌──────────────────────────────────────┐
│  Execute: DELETE FROM quizzes        │
│           WHERE id = 'quiz-123'      │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  PostgreSQL CASCADE Trigger          │
└──────────────────┬───────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
┌────────────────┐   ┌─────────────────┐
│ DELETE FROM    │   │ DELETE FROM     │
│ questions      │   │ quiz_attempts   │
│ WHERE quiz_id  │   │ WHERE quiz_id   │
│ = 'quiz-123'   │   │ = 'quiz-123'    │
└────────┬───────┘   └────────┬────────┘
         │                    │
         └─────────┬──────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  All Data Permanently Removed        │
│  ✓ Quiz deleted                      │
│  ✓ 5 questions deleted               │
│  ✓ 12 attempts deleted               │
│  ✓ Points removed from users         │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Success Response → UI Updates       │
└──────────────────────────────────────┘
```

## 📈 Before & After Comparison

### BEFORE Deletion
```
Database State:

QUIZZES TABLE
┌────────────┬───────────────────┬──────────────┐
│ id         │ title             │ created_by   │
├────────────┼───────────────────┼──────────────┤
│ quiz-123   │ Math Quiz         │ user-456     │
│ quiz-789   │ Science Quiz      │ user-456     │
└────────────┴───────────────────┴──────────────┘

QUESTIONS TABLE
┌────────────┬───────────────┬─────────────────────┐
│ id         │ quiz_id       │ question_text       │
├────────────┼───────────────┼─────────────────────┤
│ q1         │ quiz-123      │ What is 2+2?        │
│ q2         │ quiz-123      │ What is 5*5?        │
│ q3         │ quiz-123      │ What is 10/2?       │
│ q4         │ quiz-789      │ What is H2O?        │
└────────────┴───────────────┴─────────────────────┘

QUIZ_ATTEMPTS TABLE
┌────────────┬───────────────┬───────────┬────────┐
│ id         │ quiz_id       │ user_id   │ score  │
├────────────┼───────────────┼───────────┼────────┤
│ a1         │ quiz-123      │ user-111  │ 80     │
│ a2         │ quiz-123      │ user-222  │ 90     │
│ a3         │ quiz-123      │ user-333  │ 70     │
│ a4         │ quiz-789      │ user-111  │ 85     │
└────────────┴───────────────┴───────────┴────────┘
```

### AFTER Deleting quiz-123
```
Database State:

QUIZZES TABLE
┌────────────┬───────────────────┬──────────────┐
│ id         │ title             │ created_by   │
├────────────┼───────────────────┼──────────────┤
│ quiz-789   │ Science Quiz      │ user-456     │  ✓ Still exists
└────────────┴───────────────────┴──────────────┘

QUESTIONS TABLE
┌────────────┬───────────────┬─────────────────────┐
│ id         │ quiz_id       │ question_text       │
├────────────┼───────────────┼─────────────────────┤
│ q4         │ quiz-789      │ What is H2O?        │  ✓ Still exists
└────────────┴───────────────┴─────────────────────┘
                                                    ✗ q1, q2, q3 deleted

QUIZ_ATTEMPTS TABLE
┌────────────┬───────────────┬───────────┬────────┐
│ id         │ quiz_id       │ user_id   │ score  │
├────────────┼───────────────┼───────────┼────────┤
│ a4         │ quiz-789      │ user-111  │ 85     │  ✓ Still exists
└────────────┴───────────────┴───────────┴────────┘
                                                    ✗ a1, a2, a3 deleted

IMPACT:
• user-111 lost 80 points
• user-222 lost 90 points  
• user-333 lost 70 points
• All three users lost quiz-123 from their history
```

## 🎯 User Impact Scenarios

### Scenario 1: Quiz Creator Perspective
```
BEFORE DELETE:
┌─────────────────────────┐
│  My Quizzes             │
├─────────────────────────┤
│ ✏️ Math Quiz (Active)   │  ← Delete this
│   • 5 questions         │
│   • 12 attempts         │
│                         │
│ ✏️ Science Quiz         │
└─────────────────────────┘

AFTER DELETE:
┌─────────────────────────┐
│  My Quizzes             │
├─────────────────────────┤
│ ✏️ Science Quiz         │  ← Only this remains
└─────────────────────────┘
```

### Scenario 2: Quiz Taker Perspective
```
BEFORE DELETE:
┌─────────────────────────┐
│  My History             │
├─────────────────────────┤
│ 📊 Math Quiz            │  ← Their score here
│    Score: 85%           │     will be deleted
│    Rank: #3             │
│                         │
│ 📊 Science Quiz         │
│    Score: 90%           │
│    Rank: #1             │
└─────────────────���───────┘

AFTER DELETE:
┌─────────────────────────┐
│  My History             │
├─────────────────────────┤
│ 📊 Science Quiz         │  ← Only this remains
│    Score: 90%           │
│    Rank: #1             │
└─────────────────────────┘
```

### Scenario 3: Leaderboard Impact
```
BEFORE DELETE:
┌────────────────────────────────┐
│  Global Leaderboard            │
├────────┬───────────────────────┤
│ Rank   │ User      │ Points    │
├────────┼───────────┼───────────┤
│ 🥇 #1  │ Alice     │ 250 pts  │  ← Has 100pts from deleted quiz
│ 🥈 #2  │ Bob       │ 200 pts  │  ← Has 50pts from deleted quiz
│ 🥉 #3  │ Charlie   │ 180 pts  │  ← No points from deleted quiz
└────────┴───────────┴───────────┘

AFTER DELETE (automatically recalculated):
┌────────────────────────────────┐
│  Global Leaderboard            │
├────────┬───────────────────────┤
│ Rank   │ User      │ Points    │
├────────┼───────────┼───────────┤
│ 🥇 #1  │ Charlie   │ 180 pts  │  ← Now #1!
│ 🥈 #2  │ Alice     │ 150 pts  │  ← Dropped to #2
│ 🥉 #3  │ Bob       │ 150 pts  │  ← Dropped to #3
└────────┴───────────┴───────────┘
```

## ⚡ Performance & Safety

### Atomic Transaction
```
BEGIN TRANSACTION;
    ├─ DELETE FROM quizzes WHERE id = 'quiz-123'
    ├─ CASCADE: DELETE FROM questions WHERE quiz_id = 'quiz-123'
    ├─ CASCADE: DELETE FROM quiz_attempts WHERE quiz_id = 'quiz-123'
    │
    ├─ All succeed? → COMMIT
    └─ Any fail? → ROLLBACK (nothing deleted)
END TRANSACTION;
```

### Speed Comparison
```
❌ WITHOUT CASCADE (Multiple API calls):
   DELETE quiz → 50ms
   DELETE questions → 30ms × 5 = 150ms
   DELETE attempts → 20ms × 12 = 240ms
   TOTAL: ~440ms + network overhead

✅ WITH CASCADE (Single operation):
   DELETE quiz (with cascade) → 80ms
   TOTAL: ~80ms
   
   Speed improvement: 5.5x faster! 🚀
```

## 🔍 Debugging & Verification

### Check CASCADE is Enabled
```sql
-- Run in Supabase SQL Editor
SELECT
  tc.table_name, 
  tc.constraint_name,
  rc.delete_rule as "ON DELETE"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('questions', 'quiz_attempts')
  AND tc.constraint_type = 'FOREIGN KEY';

Expected Output:
┌─────────────────┬───────────────────────────────┬─────────┐
│ table_name      │ constraint_name               │ DELETE  │
├─────────────────┼───────────────────────────────┼─────────┤
│ questions       │ questions_quiz_id_fkey        │ CASCADE │ ✓
│ quiz_attempts   │ quiz_attempts_quiz_id_fkey    │ CASCADE │ ✓
└─────────────────┴───────────────────────────────┴─────────┘
```

## 📚 Related Documentation

- **Full Documentation**: `docs/CASCADE_DELETE_FEATURE.md`
- **Quick Start**: `docs/CASCADE_DELETE_QUICKSTART.md`
- **Implementation**: `docs/CASCADE_DELETE_IMPLEMENTATION_SUMMARY.md`
- **Migration Script**: `db/migrations/2025-10-19-ensure-cascade-delete.sql`
