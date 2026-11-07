import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { isMockMode, supabase } from '../services/supabase';
import { ensureProfile } from '../services/data';
import { mockMe } from '../mock';
import type { Profile } from '../types';

WebBrowser.maybeCompleteAuthSession();

function extractParam(url: string, name: string): string | null {
  try {
    return new URL(url).searchParams.get(name);
  } catch {
    const m = new RegExp(`[?&#]${name}=([^&#]+)`).exec(url);
    return m ? decodeURIComponent(m[1]) : null;
  }
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('provider') && m.includes('not enabled')) return 'Google sign-in is not enabled yet — enable the Google provider in Supabase first.';
  return message;
}

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
      if (data.session?.user) {
        // Profiles are created by the app after sign-in (no DB trigger), and
        // every write FK-references profiles(id) — create the row here so
        // posting can never hit the missing-profile error. Never blocks
        // sign-in if it fails; the write paths retry it before inserting.
        ensureProfile(data.session.user).catch(() => {});
        setUser({ ...mockMe, id: data.session.user.id, username: data.session.user.email?.split('@')[0] ?? 'you' });
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        ensureProfile(session.user).catch(() => {});
        setUser({ ...mockMe, id: session.user.id, username: session.user.email?.split('@')[0] ?? 'you' });
      }
      else setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => ({
    user, loading, isMock: isMockMode,
    demoSignIn: async () => { setUser(mockMe); },
    signInWithGoogle: async () => {
      if (isMockMode || !supabase) { setUser(mockMe); return; }
      // Same flow as Nearry (proven on device): Supabase returns the Google
      // URL, we open it in a system browser session, then exchange the code
      // it bounces back for a session. The old code called signInWithOAuth
      // with no redirect and never opened a browser, so the button did nothing.
      const redirectTo = Linking.createURL('auth/callback'); // ispy://auth/callback
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw new Error(friendlyAuthError(error.message));
      if (!data.url) throw new Error('Could not start Google sign-in.');
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success' || !res.url) throw new Error('Google sign-in was cancelled.');
      const code = extractParam(res.url, 'code');
      if (!code) {
        const detail = extractParam(res.url, 'error_description') || extractParam(res.url, 'error');
        if (detail) throw new Error(`Google sign-in failed: ${detail}`);
        // No code but a token means Supabase used the implicit flow instead
        // of PKCE (flowType must be 'pkce' in the Supabase client) — say so
        // plainly instead of the generic message, it decides the fix.
        if (extractParam(res.url, 'access_token')) throw new Error('Google sign-in returned a token instead of an auth code (flow mismatch — the app needs the PKCE code flow).');
        throw new Error('Google sign-in completed without an auth code.');
      }
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw new Error(friendlyAuthError(exchangeError.message));
      if (sessionData.user) setUser({ ...mockMe, id: sessionData.user.id, username: sessionData.user.email?.split('@')[0] ?? 'you' });
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
