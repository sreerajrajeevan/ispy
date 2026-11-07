import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when no Supabase project is configured — the app runs on mock data. */
export const isMockMode: boolean = !url || !anonKey;

export const supabase: SupabaseClient | null = isMockMode
  ? null
  : createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // PKCE is REQUIRED for the app's Google flow: signInWithGoogle
        // exchanges a ?code= bounced back to ispy://auth/callback. The
        // installed auth-js defaults to flowType 'implicit', which instead
        // bounces back #access_token=... with no code, so Google sign-in
        // failed with "completed without an auth code" (2026-11-07).
        flowType: 'pkce',
      },
    });
