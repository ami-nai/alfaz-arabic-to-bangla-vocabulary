import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null; message?: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: isSupabaseConfigured,
  signIn: async () => ({ error: 'Supabase setup required' }),
  signUp: async () => ({ error: 'Supabase setup required' }),
  signInWithGoogle: async () => ({ error: 'Supabase setup required' }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Get active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('Supabase auth session fetch notice:', err);
      setLoading(false);
    });

    // Listen to Auth State changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'অ্যাকাউন্ট সার্ভিস বর্তমানে সংযুক্ত নেই।' };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'লগইন করতে সমস্যা হয়েছে।' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'অ্যাকাউন্ট সার্ভিস বর্তমানে সংযুক্ত নেই।' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || '',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.user && !data?.session) {
        return {
          error: null,
          message: 'নিবন্ধন সফল হয়েছে! অনুগ্রহ করে আপনার ইমেইল ইনবক্সে যাচাইকরণ লিঙ্কটি চেক করুন।',
        };
      }

      return { error: null, message: 'সফলভাবে অ্যাকাউন্ট তৈরি ও লগইন করা হয়েছে!' };
    } catch (err: any) {
      return { error: err.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।' };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'অ্যাকাউন্ট সার্ভিস বর্তমানে সংযুক্ত নেই।' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'গুগল দিয়ে প্রবেশ করতে সমস্যা হয়েছে।' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
