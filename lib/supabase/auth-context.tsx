'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { isSupabaseConfigured, createClient } from './client';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const [configured, setConfigured] = useState(false);
  
  // Initialize Supabase client
  useEffect(() => {
    const isConfigured = isSupabaseConfigured();
    setConfigured(isConfigured);
    
    if (isConfigured) {
      try {
        const client = createClient();
        setSupabase(client);
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
        setIsLoading(false);
      }
    } else {
      console.warn('Supabase not configured. Authentication features are disabled.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase]);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }, [supabase]);

  const value = {
    user,
    session,
    isLoading,
    isConfigured: configured,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
