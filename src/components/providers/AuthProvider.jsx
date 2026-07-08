'use client';

import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';

export default function AuthProvider({ children }) {
  const { setUser, setProfile, clearAuth, setAuthLoading } = useAppStore();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (profileData && mounted) {
            setProfile(profileData);
          }
        } else if (mounted) {
          // If no session is found, ensure user is set to null
          setUser(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }
    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            if (profileData && mounted) setProfile(profileData);
          }
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [setUser, setProfile, clearAuth, supabase]);

  return <>{children}</>;
}
