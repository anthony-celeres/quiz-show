# 🎯 Quick Start - Username Feature

## What's New?
Challengers can now set usernames that appear on:
- ✅ Quizzes they create (showing "by @username")
- ✅ Global leaderboard
- ✅ Quiz-specific leaderboards

## 🚀 Setup (2 Steps)

### Step 1: Run Database Migration
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire content of `db/migrations/2025-10-19-add-user-profiles.sql`
4. Paste and run it
5. Verify success (should see "Total profiles created" message)

### Step 2: Test It!
1. Start your app: `npm run dev`
2. Login or register
3. Visit: http://localhost:3000/challenger/profile
4. Set your username
5. Create a quiz → See your username on it!
6. Check leaderboard → See usernames instead of emails!

## 📝 Username Rules
- **Length**: 3-30 characters
- **Format**: Letters, numbers, underscores (_), hyphens (-)
- **Unique**: No duplicates allowed
- **Examples**: `john_doe`, `QuizMaster-99`, `challenger2025`

## 🔧 Where to Find Things

**Profile Page**: `/challenger/profile`
**API Endpoint**: `/api/profile` (GET, POST, PUT)
**Component**: `components/UsernameSetup.tsx`
**Migration**: `db/migrations/2025-10-19-add-user-profiles.sql`

## 📚 Full Documentation
See `docs/USERNAME_FEATURE.md` for complete details.

## 🎨 What Users See

### Quiz List
```
Quiz Title
by @john_doe • Updated 10/19/2025 • Public
```

### Leaderboard
```
🥇 John Doe
   @john_doe
   5 quizzes taken
```

## ✅ That's It!
Your users can now have unique identities in your quiz app!
