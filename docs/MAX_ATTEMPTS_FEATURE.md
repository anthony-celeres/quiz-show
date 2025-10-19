# Max Attempts Feature

## Overview
Control how many times challengers can take a quiz. This is useful for exams (limit to 1 attempt), practice quizzes (unlimited), or controlled assessments (specific number of attempts).

## Features Implemented

### 1. Database Schema
**New Column**: `max_attempts` in `quizzes` table
- **Type**: INTEGER
- **Default**: NULL (unlimited attempts)
- **Constraint**: NULL or >= 0
- **Values**:
  - `NULL` or `0` = Unlimited attempts
  - `1` = One-time only (exam mode)
  - `2`, `3`, `5`, `10`, etc. = Specific number of attempts

**Migration**: Added to `db/migrations/2025-10-19-migrate-to-challenger-role.sql` (Step 8b)

### 2. Quiz Creation Form
**Location**: `components/ChallengerQuizForm.tsx`

**UI Control**: Dropdown selector with predefined options:
- Unlimited (default)
- 1 attempt (One-time only)
- 2 attempts
- 3 attempts
- 5 attempts
- 10 attempts

**Help Text**: "Controls how many times a user can take this quiz. Choose 'Unlimited' for practice quizzes."

### 3. Quiz Display
**Location**: `app/challenger/quizzes/page.client.tsx`

**Visual Indicators**:
- Shows current attempt count: "Attempts: X / Y" (for limited quizzes)
- Shows "Attempts: X (Unlimited)" for unlimited quizzes
- Warning message when max attempts reached: "You have reached the maximum number of attempts for this quiz."
- Button state changes: "Max Attempts Reached" (disabled)

### 4. Backend Enforcement
**Location**: `app/api/attempts/route.ts`

**Validation Logic**:
1. Checks quiz's `max_attempts` value before allowing attempt
2. Counts user's existing attempts for that quiz (respects `activation_cycle`)
3. Returns 403 Forbidden if limit reached
4. Error message: "You have reached the maximum number of attempts (X) for this quiz."

### 5. Type Definitions
**Location**: `types/quiz.ts`

Added `max_attempts?: number | null` to Quiz interface

## Usage Examples

### Example 1: Create an Exam (One-time Only)
```
Title: Final Exam - Mathematics
Duration: 60 minutes
Max Attempts: 1 attempt (One-time only)
Visibility: Public
```
**Result**: Students can only take this quiz once. Perfect for graded exams.

### Example 2: Create a Practice Quiz
```
Title: Practice Problems - Algebra
Duration: 30 minutes
Max Attempts: Unlimited
Visibility: Public
```
**Result**: Students can take this quiz as many times as they want to practice.

### Example 3: Create a Quiz with Retries
```
Title: Unit Test - Chapter 5
Duration: 45 minutes
Max Attempts: 3 attempts
Visibility: Private
```
**Result**: Students get 3 chances to improve their score.

## User Experience Flow

### Taking a Quiz
1. User views quiz list
2. Sees attempt count: "Attempts: 1 / 3"
3. Clicks "Start Quiz"
4. Completes quiz
5. Returns to quiz list
6. Now shows: "Attempts: 2 / 3"
7. Can take again until limit reached
8. After 3rd attempt: Button shows "Max Attempts Reached" (disabled)

### Bypassing Limits (Quiz Owners)
Quiz owners can:
- Always take their own quizzes regardless of attempt limits
- Edit the quiz to change `max_attempts` value
- View all attempts on their quizzes (including from other users)

## Database Migration

To add this feature to existing database:

```sql
-- Already included in Step 8b of main migration
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT NULL 
CHECK (max_attempts IS NULL OR max_attempts >= 0);

-- Update existing quizzes to allow unlimited attempts
UPDATE quizzes 
SET max_attempts = NULL 
WHERE max_attempts IS NULL;
```

## API Changes

### POST /api/quizzes
**Request Body** (new field):
```json
{
  "title": "Quiz Title",
  "max_attempts": 3,  // or null for unlimited
  ...
}
```

### PUT /api/quizzes/[quizId]
Can update `max_attempts` value when editing quiz

### POST /api/attempts
**Validation**: Checks attempt limit before creating attempt
**Error Response** (if limit reached):
```json
{
  "error": "You have reached the maximum number of attempts (3) for this quiz."
}
```
**Status**: 403 Forbidden

## Security Considerations

1. **Backend Validation**: Attempts are validated server-side, not just in UI
2. **RLS Policies**: Database-level security enforces visibility rules
3. **Activation Cycle**: Attempts are counted per activation cycle (allows quiz resets)
4. **Owner Exception**: Quiz creators can bypass their own attempt limits for testing

## Testing Checklist

- [ ] Create quiz with 1 attempt limit
- [ ] Take quiz once - should succeed
- [ ] Try to take again - should show "Max Attempts Reached"
- [ ] Create quiz with 3 attempts
- [ ] Take quiz 3 times - all should succeed
- [ ] Try 4th attempt - should be blocked
- [ ] Create quiz with unlimited attempts
- [ ] Take multiple times - should always work
- [ ] Edit quiz to change attempts limit
- [ ] Verify new limit is enforced
- [ ] Check that owner can always take their own quiz

## Future Enhancements

- [ ] Reset attempts functionality (for teachers)
- [ ] Per-user attempt count override
- [ ] Time-based attempt limits (e.g., 1 per day)
- [ ] Show best score across multiple attempts
- [ ] Attempt history with timestamps
- [ ] Export attempt statistics
