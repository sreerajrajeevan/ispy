import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isMockMode, supabase } from '../services/supabase';
import { mockMe } from '../mock';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  isMock: boolean;
  demoSignIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode || !supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser({ ...mockMe, id: data.session.user.id, username: data.session.user.email?.split('@')[0] ?? 'you' });
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) setUser({ ...mockMe, id: session.user.id, username: session.user.email?.split('@')[0] ?? 'you' });
      else setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => ({
    user, loading, isMock: isMockMode,
    demoSignIn: async () => { setUser(mockMe); },
    signInWithGoogle: async () => {
      if (isMockMode || !supabase) { setUser(mockMe); return; }
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    },
    sendOtp: async (email: string) => {
      if (isMockMode || !supabase) return;
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    },
    verifyOtp: async (email: string, code: string) => {
      if (isMockMode || !supabase) { setUser(mockMe); return; }
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      if (data.user) setUser({ ...mockMe, id: data.user.id });
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setUser(null);
    },
  }), [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
