import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { email, password, role = 'challenger' } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (role !== 'challenger') {
      return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 });
    }  const redirectUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL;
  const origin = request.headers.get('origin');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrlFromEnv ?? origin ?? undefined,
        data: {
          role,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data?.user?.id) {
      await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: data.user.id,
            role,
          },
          { onConflict: 'user_id' }
        );
    }

    // Return user data and session information
    return NextResponse.json({ 
      data,
      message: data.user?.identities?.length === 0 
        ? 'User already registered. Please check your email to confirm your account or sign in.' 
        : 'Registration successful! Please check your email to confirm your account.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error during registration', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to register.' }, { status: 500 });
  }
}
