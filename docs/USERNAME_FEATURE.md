# Username Feature Documentation

## Overview
Challengers can now set and manage their usernames, which will be displayed on quizzes they create and on the leaderboard.

## Features

### 1. User Profiles
- Each user has a profile with a unique username
- Profile includes:
  - **Username**: Unique identifier (3-30 characters, alphanumeric with underscores/hyphens)
  - **Display Name**: Optional friendly name (defaults to username)
  - Automatically created on user registration

### 2. Username Management
- Users can set/update their username at `/challenger/profile`
- Username validation:
  - Length: 3-30 characters
  - Format: Letters, numbers, underscores, and hyphens only
  - Must be unique across all users
- Default username generated from email prefix on signup

### 3. Quiz Attribution
- Quizzes now display the creator's username
- Format: "by [Display Name or Username]"
- Only shown on quizzes created by other users (not your own)
- Located below quiz title

### 4. Leaderboard Display
- Global leaderboard (`/challenger/leaderboard`) shows usernames
- Quiz-specific leaderboard shows usernames
- Display priority:
  1. Display Name (if set)
  2. Username
  3. Email (fallback for legacy data)
- Shows @username as secondary info when available

## Database Structure

### Tables

#### `profiles`
```sql
- id: UUID (primary key, references auth.users)
- username: TEXT (unique, not null)
- display_name: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### Views

##### `quizzes_with_creators`
Joins quizzes with creator profile information:
- All quiz columns
- `creator_username`
- `creator_display_name`

##### `quiz_attempts_with_profiles`
Joins quiz attempts with profile information:
- All quiz_attempts columns
- `username`
- `display_name`

### Row Level Security (RLS)
- **SELECT**: Anyone can view profiles (for leaderboard and attribution)
- **INSERT**: Users can only create their own profile
- **UPDATE**: Users can only update their own profile

## API Endpoints

### `/api/profile`

#### GET
Fetches the current user's profile
- **Auth**: Required
- **Response**: Profile object

#### POST
Creates a new profile for the current user
- **Auth**: Required
- **Body**: `{ username, display_name? }`
- **Response**: Created profile
- **Errors**: 
  - 400: Invalid username format/length
  - 409: Username already taken

#### PUT
Updates the current user's profile
- **Auth**: Required
- **Body**: `{ username, display_name? }`
- **Response**: Updated profile
- **Errors**: 
  - 400: Invalid username format/length
  - 409: Username already taken

## Components

### `UsernameSetup`
- Used for initial username setup and profile editing
- Props:
  - `userId`: Current user ID
  - `userEmail`: Current user email
  - `onComplete?`: Callback after successful save
  - `showSkip?`: Whether to show skip button
- Features:
  - Real-time validation
  - Checks for existing profile
  - Error handling
  - Success state with redirect

### Updates to Existing Components

#### `ChallengerQuizzesPage`
- Now fetches from `quizzes_with_creators` view
- Displays creator username below quiz title
- Shows "by [creator]" for quizzes created by others

#### `Leaderboard`
- Fetches from `quiz_attempts_with_profiles` view
- Displays username/display name instead of email
- Shows @username as secondary identifier

#### `QuizLeaderboard`
- Fetches from `quiz_attempts_with_profiles` view
- Displays username/display name for each attempt
- Shows @username as secondary identifier

## Migration

### File: `2025-10-19-add-user-profiles.sql`

**What it does**:
1. Creates `profiles` table
2. Sets up indexes for performance
3. Enables RLS with appropriate policies
4. Creates auto-profile creation trigger on user signup
5. Migrates existing users to have profiles
6. Creates views for easy querying

**Running the migration**:
```sql
-- Run in Supabase SQL Editor
-- Execute the contents of db/migrations/2025-10-19-add-user-profiles.sql
```

## User Flow

### New User Registration
1. User signs up
2. Trigger automatically creates profile with default username (from email)
3. User is prompted to customize their username (optional)
4. Username appears on their quizzes and leaderboard entries

### Existing User
1. Migration creates profile with default username
2. User can update username at `/challenger/profile`
3. Updated username immediately reflects on quizzes and leaderboard

### Creating a Quiz
1. Quiz is created with `created_by` field (existing)
2. Quiz listing fetches creator username from profile
3. Quiz displays "by [creator username]" to other users

### Taking a Quiz
1. Quiz attempt is recorded with user_id (existing)
2. Leaderboard fetches username from profile
3. Display shows username instead of email

## Type Updates

### `types/quiz.ts`

Added interfaces:
```typescript
interface Profile {
  id: string;
  username: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

interface QuizWithCreator extends Quiz {
  creator_username?: string;
  creator_display_name?: string;
}

interface QuizAttemptWithProfile extends QuizAttempt {
  username?: string;
  display_name?: string;
}
```

## Future Enhancements

Potential additions:
- Profile pictures/avatars
- Bio or description field
- User statistics page
- Search users by username
- Follow/friend system
- User badges or achievements
- Username change history/audit log
