# Vercel Environment Variables Setup

## Error: Missing Supabase Environment Variables

If you see this error on Vercel:
```
[Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!]
```

You need to add your Supabase credentials to Vercel's environment variables.

## Step-by-Step Guide

### 1. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click on the **⚙️ Settings** icon in the left sidebar
4. Click on **API** in the Settings menu
5. You'll find two important values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2. Add Environment Variables to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **quiz-show** project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left menu
5. Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Project URL from Supabase | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon/public key from Supabase | Production, Preview, Development |

6. Click **Save** for each variable

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted
# Select: Production, Preview, Development (use spacebar to select all)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
# Select: Production, Preview, Development (use spacebar to select all)
```

### 3. Redeploy Your Application

After adding the environment variables, you need to trigger a new deployment:

#### Option A: Redeploy via Dashboard
1. Go to your project in Vercel
2. Click on the **Deployments** tab
3. Find the latest deployment
4. Click the **⋮** (three dots) menu
5. Click **Redeploy**

#### Option B: Redeploy via Git
```bash
# Make a small change and commit
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

#### Option C: Redeploy via CLI
```bash
vercel --prod
```

## Verify the Setup

After redeployment:

1. Visit your deployed app URL (e.g., `https://quiz-show.vercel.app`)
2. The middleware error should be gone
3. You should be able to:
   - Access the login page
   - Register a new account
   - Navigate through the app

## Example `.env.local` File

For local development, create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1MTI0MzIsImV4cCI6MjAwNTA4ODQzMn0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Redirect URL for email confirmation
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

**⚠️ Important:** Never commit `.env.local` to version control. It should already be in your `.gitignore`.

## Troubleshooting

### Issue: Variables not showing up
**Solution:** Make sure you selected all environments (Production, Preview, Development) when adding the variables.

### Issue: Still getting the error after adding variables
**Solution:** 
1. Wait a few minutes for Vercel to propagate the variables
2. Trigger a new deployment (not just a redeploy)
3. Clear your browser cache

### Issue: App works locally but not on Vercel
**Solution:** Double-check that:
- Variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- No extra spaces in the variable values
- Variables are set for the correct environment (Production)

### Issue: Database connection errors
**Solution:** Check your Supabase project:
1. Make sure your Supabase project is active (not paused)
2. Check if Row Level Security (RLS) policies are configured
3. Verify your database migrations have been run

## Security Notes

### ✅ Safe to Expose (Public Variables)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The anonymous/public key

These are meant to be public and are safe to use in client-side code.

### ❌ Never Expose (Server-Only)
- `SUPABASE_SERVICE_ROLE_KEY` - The service role key (if you add it later)
- Database connection strings
- Any private API keys

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**Last Updated**: October 19, 2025
