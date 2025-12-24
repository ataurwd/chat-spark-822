import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/chat';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            updateOnlineStatus(session.user.id, true);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        updateOnlineStatus(session.user.id, true);
      }
      setLoading(false);
    });

    // Handle tab close - update online status
    const handleBeforeUnload = () => {
      if (user?.id) {
        // Use sendBeacon for reliability on page unload
        navigator.sendBeacon && updateOnlineStatus(user.id, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setProfile(data as Profile);
    }
  };

  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    await supabase
      .from('profiles')
      .update({ 
        is_online: isOnline, 
        last_seen: new Date().toISOString() 
      })
      .eq('user_id', userId);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    if (user?.id) {
      await updateOnlineStatus(user.id, false);
    }
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };
};
