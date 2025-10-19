# 🚀 Quick Fix: Vercel Environment Variables

## The Error You're Seeing
```
[Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY 
env variables or supabaseUrl and supabaseKey are required!]
```

## Quick Solution (5 minutes)

### Step 1: Get Your Supabase Credentials
1. Go to https://app.supabase.com/
2. Select your project
3. Settings → API
4. Copy these two values:
   - **Project URL** 
   - **anon public key**

### Step 2: Add to Vercel
1. Go to https://vercel.com/dashboard
2. Select your **quiz-show** project
3. Settings → Environment Variables
4. Add these:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [paste your Project URL]
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [paste your anon key]
Environments: ✓ Production ✓ Preview ✓ Development
```

### Step 3: Redeploy
1. Go to Deployments tab
2. Click ⋮ on latest deployment
3. Click "Redeploy"
4. Wait ~2 minutes ⏱️

### Step 4: Test
Visit your app URL - the error should be gone! ✅

---

**Need more help?** See `VERCEL_ENVIRONMENT_SETUP.md` for detailed instructions.
