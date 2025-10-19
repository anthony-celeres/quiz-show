import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      return;
    }

    const client = supabase;
    const metadataRole = user.user_metadata?.role as 'challenger' | undefined;
    const normalizedRole = 'challenger';

    const syncUserRole = async () => {
      const { error} = await client
        .from('user_roles')
        .upsert(
          {
            user_id: user.id,
            role: normalizedRole,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Failed to sync user role', error);
      }
    };

    void syncUserRole();
  }, [user]);

  const isChallenger = user?.user_metadata?.role === 'challenger' || !!user;

  return {
    user,
    loading,
    isChallenger,
  };
};