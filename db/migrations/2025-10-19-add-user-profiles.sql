-- Migration: Add User Profiles with Username
-- Date: 2025-10-19
-- Description: Creates a profiles table to store user usernames and display information

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Step 2: Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Step 3: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Everyone can view profiles (for leaderboard and quiz attribution)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  sanitized_username TEXT;
BEGIN
  -- Get email prefix and sanitize it
  base_username := split_part(NEW.email, '@', 1);
  -- Replace invalid characters (periods, spaces, etc.) with underscores
  sanitized_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '_', 'g');
  
  -- Ensure username is at least 3 characters
  IF char_length(sanitized_username) < 3 THEN
    sanitized_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  
  -- Create a default profile with sanitized username
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    sanitized_username,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (username) DO NOTHING; -- If username exists, skip (user will need to update)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Migrate existing users (create profiles for existing users)
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  id,
  -- Sanitize username: replace invalid characters with underscores
  regexp_replace(
    split_part(email, '@', 1) || '_' || substr(id::text, 1, 4),
    '[^a-zA-Z0-9_-]',
    '_',
    'g'
  ) as username,
  split_part(email, '@', 1) as display_name
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (username) DO NOTHING;

-- Step 10: Create a view to join quiz attempts with usernames
CREATE OR REPLACE VIEW public.quiz_attempts_with_profiles AS
SELECT 
  qa.*,
  p.username,
  p.display_name
FROM public.quiz_attempts qa
LEFT JOIN public.profiles p ON qa.user_id = p.id;

-- Step 11: Create a view to join quizzes with creator usernames
CREATE OR REPLACE VIEW public.quizzes_with_creators AS
SELECT 
  q.*,
  p.username as creator_username,
  p.display_name as creator_display_name
FROM public.quizzes q
LEFT JOIN public.profiles p ON q.created_by = p.id;

-- Verification queries
SELECT 'Total profiles created:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'Sample profiles:' as info, username, display_name, created_at FROM public.profiles LIMIT 5;
