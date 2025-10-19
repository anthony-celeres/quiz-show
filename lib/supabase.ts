import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const canCreateBrowserClient = typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey;

export const supabase = canCreateBrowserClient
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

export const createSupabaseRouteClient = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Route client is only available on the server.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  }

  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

export const signUp = async (email: string, password: string, role: 'challenger' = 'challenger') => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured. Please set up your environment variables.' } };
  }

  const redirectUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL;
  const emailRedirectTo = redirectUrlFromEnv || (typeof window !== 'undefined' ? window.location.origin : undefined);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
      emailRedirectTo,
    },
  });

  if (!error && data?.user?.id && data.session) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: data.user.id,
          role,
        },
        { onConflict: 'user_id' }
      );

    if (roleError) {
      console.error('Failed to persist user role', roleError);
    }
  }

  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured. Please set up your environment variables.' } };
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) {
    return { error: { message: 'Supabase not configured. Please set up your environment variables.' } };
  }
  
  const { error } = await supabase.auth.signOut();
  return { error };
};