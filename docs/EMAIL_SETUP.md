# Email Confirmation Setup Guide

## Issue
When creating a new account, Supabase email confirmation is not working.

## Quick Fix (For Development)

### Disable Email Confirmation in Supabase

1. Go to your Supabase Dashboard:
   - URL: https://mazhkydgpgybrvhyxmfo.supabase.co

2. Navigate to **Authentication** → **Providers** (or **Settings**)

3. Scroll down to find **"Email"** provider settings

4. Look for **"Confirm email"** toggle and **disable it**

5. Click **Save**

Now users can:
- Register immediately without email confirmation
- Log in right after registration
- Access the app without checking email

## Production Setup (Email Provider Configuration)

### Option 1: Use Supabase's Built-in Email Service
- Limited to 3-4 emails per hour (development only)
- Go to **Settings** → **Auth** → **Email Templates**
- Customize templates if needed
- Check spam folder for emails

### Option 2: Configure Custom SMTP Provider

**Recommended providers:**
- **Resend** (easiest, modern)
- **SendGrid** (free tier: 100 emails/day)
- **AWS SES** (cheap, reliable)
- **Postmark** (great deliverability)

**Configuration steps:**
1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Enter your SMTP credentials:
   - Host
   - Port
   - Username
   - Password
   - Sender email
3. Test the configuration
4. Save changes

### Option 3: Custom Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - sent when user registers
   - **Magic Link** - for passwordless login
   - **Change Email Address**
   - **Reset Password**

## Code Changes Made

### 1. Updated Registration API Response
File: `app/api/auth/register/route.ts`
- Now returns helpful messages for different scenarios
- Detects if user already exists
- Provides clear feedback

### 2. Updated Auth Form
File: `components/AuthForm.tsx`
- Auto-login if email confirmation is disabled
- Shows appropriate messages based on Supabase configuration
- Better error handling

## Testing

### Test Email Confirmation Disabled:
1. Register a new account
2. Should be automatically logged in
3. Redirected to `/challenger` dashboard

### Test Email Confirmation Enabled:
1. Register a new account
2. See message: "Please check your email..."
3. Check inbox/spam for confirmation email
4. Click confirmation link
5. Sign in with credentials

## Troubleshooting

### Emails Not Arriving
- Check spam/junk folder
- Verify email templates are enabled
- Check Supabase logs: **Authentication** → **Logs**
- Ensure SMTP settings are correct
- Try a different email address

### "User already exists" Error
- User already registered with that email
- Either:
  - Use different email
  - Sign in instead
  - Reset password if forgotten

### Rate Limiting
- Supabase free tier limits emails
- Consider custom SMTP for production
- Users may need to wait between confirmation resends

## Environment Variables

Make sure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://mazhkydgpgybrvhyxmfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000 # or your production URL
```

## Recommended: Disable for Development

For local development, it's recommended to:
1. **Disable email confirmation** in Supabase
2. Test auth flows without email
3. Enable for staging/production only
4. Configure proper email provider for production

This provides the best developer experience while ensuring security in production.
