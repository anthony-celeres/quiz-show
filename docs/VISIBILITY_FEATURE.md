# Quiz Visibility Feature

## Overview
Every challenger can now create quizzes with two visibility options:
- **Public**: Anyone can find and take the quiz
- **Private**: Only the creator can take the quiz (for personal practice/testing)

## Database Changes

### New Column: `visibility`
Added to `quizzes` table:
```sql
ALTER TABLE quizzes 
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));
```

### Updated RLS Policies

**Quizzes Table:**
- `Challengers can view quizzes based on visibility`: Users can see public quizzes + their own private quizzes
- Other policies remain (create, update, delete by owner)

**Questions Table:**
- `Challengers can view questions based on quiz visibility`: Respects parent quiz visibility
- Users can manage questions only for their own quizzes

**Quiz Attempts Table:**
- `Challengers can create attempts for accessible quizzes`: Can attempt public quizzes + own private quizzes
- `Challengers can view own attempts or attempts on own quizzes`: Creators can see who took their public quizzes

## API Updates

### POST /api/quizzes
Now accepts `visibility` field:
```json
{
  "title": "My Quiz",
  "description": "...",
  "duration_minutes": 15,
  "visibility": "public",  // or "private"
  "questions": [...]
}
```

Validates visibility is either "public" or "private".

### GET /api/quizzes
Returns quizzes based on RLS policies:
- Public quizzes visible to all authenticated users
- Private quizzes only visible to creator

## UI Features

### Create Quiz Page
- New route: `/challenger/quizzes/new`
- Visual toggle between Public/Private visibility
- Shows icons:
  - 🌐 Globe for Public
  - 🔒 Lock for Private

### Quizzes List Page
- Shows "Your Quiz" badge for quizzes you created
- Displays visibility status (Public/Private)
- Edit button for your own quizzes
- Can attempt:
  - All public quizzes (once per cycle)
  - Your own private quizzes

### Challenger Layout
- Added "+ Create Quiz" button in navigation bar
- Quick access to quiz creation

## User Experience

### Creating a Quiz
1. Click "+ Create Quiz" in navigation
2. Fill in title, description, duration
3. Choose visibility:
   - **Public**: Share with community, appears on everyone's quiz list
   - **Private**: Personal practice, only you see it
4. Add questions with answers and points
5. Submit

### Taking Quizzes
- **Public quizzes**: Anyone can take once per activation cycle
- **Private quizzes**: Only creator can take (useful for testing before making public)

### Managing Your Quizzes
- See "Your Quiz" badge on quizzes you created
- Edit button to modify your quizzes
- View attempts on your public quizzes (see who scored what)

## Migration Instructions

Run the updated migration file:
```bash
# In Supabase SQL Editor
db/migrations/2025-10-19-migrate-to-challenger-role.sql
```

This will:
1. Convert all users to 'challenger' role
2. Add `visibility` column to quizzes (defaults to 'public')
3. Update all RLS policies to respect visibility
4. Set up proper permissions for quiz creation and attempts

## Benefits

### For Creators
- Test quizzes privately before publishing
- Create personal practice quizzes
- Share knowledge with public quizzes
- Track who takes your public quizzes

### For Participants
- Access to community-created quizzes
- Can also create and share their own
- Everyone is empowered to both teach and learn

## Security

- RLS policies enforce visibility at database level
- Cannot access private quizzes you don't own (even with direct API calls)
- Questions inherit visibility from parent quiz
- Attempts are only allowed for accessible quizzes
