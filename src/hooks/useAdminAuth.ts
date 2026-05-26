import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdmin(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdmin(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = (user: User | null | undefined) => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // Assuming admin flag is stored in user_metadata or app_metadata
    const isUserAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.is_admin === true;
    setIsAdmin(isUserAdmin);
    setIsLoading(false);
  };

  return { session, user, isAdmin, isLoading };
}
